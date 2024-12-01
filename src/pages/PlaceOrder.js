import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";

const PlaceOrder = () => {
    const { userBusinessData } = useAuth();
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);

    // Fetch stores
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { data, error } = await supabase
                    .from("business_relations")
                    .select(
                        "relation_id, relation_type, business_uid_1, business_uid_2, business_2: businesses!business_uid_2(business_name, owner_name, contact, business_uid)"
                    )
                    .eq("business_uid_1", userBusinessData.business_uid);

                if (error) {
                    console.error("Error fetching stores:", error);
                    return;
                }

                const storeOptions = data.map((relation) => ({
                    value: relation.business_2.business_uid,
                    label: relation.business_2.business_name,
                }));

                setStores(storeOptions);
            } catch (error) {
                console.error("Error fetching stores:", error.message);
            }
        };

        fetchStores();
    }, [userBusinessData]);

    // Fetch products for the selected store
    const fetchProductsAndInventory = async (store) => {
        if (!store) return;

        setLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select("id, product_name, rate, mrp, qty_in_ctn, image_url")
                .eq("seller_uid", store.value);

            if (error) {
                console.error("Error fetching products:", error.message);
                return;
            }

            setProducts(data);
            setOrderItems(
                data.map((product) => ({
                    product: { value: product.id, label: product.product_name },
                    quantityInPcs: 0,
                    quantityInCrtn: 0,
                    total: 0,
                    quantityInvalid: false,
                }))
            );
        } catch (error) {
            console.error("Error fetching products:", error.message);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Calculate grand total
    const calculateTotal = (items) => {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        setGrandTotal(total);
    };

    // Handle quantity changes with + and - buttons
    const handleQuantityChange = (value, index, type) => {
        const updatedOrderItems = [...orderItems];
        const selectedProduct = products.find(
            (product) => product.id === updatedOrderItems[index].product?.value
        );

        if (!selectedProduct) return;

        const qtyInCtn = selectedProduct.qty_in_ctn || 1;

        let pcsValue = parseInt(updatedOrderItems[index].quantityInPcs, 10) || 0;
        let crtnValue = parseInt(updatedOrderItems[index].quantityInCrtn, 10) || 0;

        let quantityInvalid = false;

        const adjustQuantities = (pcs, ctn, productQtyInCtn) => {
            const totalPcs = pcs + ctn * productQtyInCtn;
            return {
                adjustedCartons: Math.floor(totalPcs / productQtyInCtn),
                adjustedPieces: totalPcs % productQtyInCtn,
            };
        };

        if (type === "pcs") {
            pcsValue = value;
            if (pcsValue < 0 || isNaN(pcsValue)) {
                quantityInvalid = true;
            } else if (selectedProduct.qty_in_ctn !== null) {
                const { adjustedCartons, adjustedPieces } = adjustQuantities(
                    pcsValue,
                    crtnValue,
                    qtyInCtn
                );
                crtnValue = adjustedCartons;
                pcsValue = adjustedPieces;
            }
        } else if (type === "crtn" && selectedProduct.qty_in_ctn !== null) {
            crtnValue = value;
            if (crtnValue < 0 || isNaN(crtnValue)) {
                quantityInvalid = true;
            } else {
                const { adjustedCartons, adjustedPieces } = adjustQuantities(
                    pcsValue % qtyInCtn,
                    crtnValue,
                    qtyInCtn
                );
                crtnValue = adjustedCartons;
                pcsValue = adjustedPieces;
            }
        }

        updatedOrderItems[index] = {
            ...updatedOrderItems[index],
            quantityInPcs: pcsValue,
            quantityInCrtn: crtnValue,
            quantityInvalid,
            total: (pcsValue + qtyInCtn * crtnValue) * selectedProduct.rate,
        };

        setOrderItems(updatedOrderItems);
        calculateTotal(updatedOrderItems);
    };

    return (
        <div className="container my-5">
            <style>
                {`input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield; /* Firefox */
}
`}
            </style>
            <h1 className="mb-4">Place Order</h1>

            <div className="row">
                <div className="col-md-8">
                    <div className="mb-4">
                        <label htmlFor="selectBusiness" className="form-label">
                            Select Business
                        </label>
                        <select
                            id="selectBusiness"
                            className="form-select"
                            onChange={(e) => {
                                const selected = stores.find(
                                    (store) => store.value === e.target.value
                                );
                                setSelectedStore(selected);
                                fetchProductsAndInventory(selected);
                            }}
                        >
                            <option value="">-- Select a Business --</option>
                            {stores.map((store) => (
                                <option key={store.value} value={store.value}>
                                    {store.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="row">
                        {loadingProducts ? (
                            <p>Loading products...</p>
                        ) : (
                            products.map((product, index) => (
                                <div key={product.id} className="col-md-4 border mb-4">
<div key={product.id}>
    <div className="card border h-100 shadow-sm">
        {/* Product Image */}
        <img
            src={`https://qjxkpwpdalwkedmixrac.supabase.co/storage/v1/object/public/product-images/${product.image_url}`}
            className="card-img-top m-1"
            style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
            }}
            alt={product.product_name}
        />

        <div className="card-body">
            {/* Product Name */}
            <h5 className="card-title text-truncate" style={{ maxWidth: '100%' }}>
                {product.product_name}
            </h5>

            {/* Divider */}
            <hr className="my-2" />

            {/* Rate and MRP */}
            <p>
                <strong>Rate: </strong>₹{product.rate.toFixed(2)} <br />
                <strong>MRP: </strong>₹{product.mrp.toFixed(2)}
            </p>

            {/* Divider */}
            <hr className="my-2" />

            {/* PCS/Carton */}
            <p className="card-text">
                <strong>PCS/Carton: </strong>{product.pcsInCarton}
            </p>

            {/* Divider */}
            <hr className="my-2" />

            {/* Quantity Controls for PCS */}
            <div className="mb-3">
                <label htmlFor="pcsQuantity" className="form-label">
                    Pcs
                </label>
                <div className="input-group">
                    <button
                        className="btn btn-dark btn-sm"
                        type="button"
                        onClick={() =>
                            handleQuantityChange(orderItems[index].quantityInPcs - 1, index, "pcs")
                        }
                        disabled={orderItems[index].quantityInPcs <= 0}
                    >
                        -
                    </button>

                    <input
                        id="pcsQuantity"
                        type="number"
                        className="form-control"
                        min="0"
                        value={orderItems[index]?.quantityInPcs || 0}
                        onChange={(e) =>
                            handleQuantityChange(parseInt(e.target.value, 10), index, "pcs")
                        }
                        style={{ textAlign: "center" }} // Center the text in the input field
                    />

                    <button
                        className="btn btn-dark btn-sm"
                        type="button"
                        onClick={() =>
                            handleQuantityChange(orderItems[index].quantityInPcs + 1, index, "pcs")
                        }
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Quantity Controls for Cartons (if applicable) */}
            {product.qty_in_ctn && (
                <div className="mb-3">
                    <label htmlFor="ctnQuantity" className="form-label">
                        Cartons
                    </label>
                    <div className="input-group">
                        <button
                            className="btn btn-dark btn-sm"
                            type="button"
                            onClick={() =>
                                handleQuantityChange(orderItems[index].quantityInCrtn - 1, index, "crtn")
                            }
                            disabled={orderItems[index].quantityInCrtn <= 0}
                        >
                            -
                        </button>

                        <input
                            id="ctnQuantity"
                            type="number"
                            className="form-control"
                            min="0"
                            value={orderItems[index]?.quantityInCrtn || 0}
                            onChange={(e) =>
                                handleQuantityChange(parseInt(e.target.value, 10), index, "crtn")
                            }
                            style={{ textAlign: "center" }} // Center the text in the input field
                        />

                        <button
                            className="btn btn-dark btn-sm"
                            type="button"
                            onClick={() =>
                                handleQuantityChange(orderItems[index].quantityInCrtn + 1, index, "crtn")
                            }
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
</div>

                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Order Summary</h5>
                        </div>
                        <div className="card-body">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th style={{ width: "50%" }}>Item</th>
                                        <th style={{ width: "20%" }}>Qty</th>
                                        <th style={{ width: "30%" }} className="text-end">
                                            Total (₹)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems
                                        .filter((item) => item.quantityInPcs > 0 || item.quantityInCrtn > 0)
                                        .map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    {item.product.label}
                                                    <br />
                                                </td>
                                                <td>
                                                    {item.quantityInPcs > 0 && `${item.quantityInPcs} pcs`}
                                                    <br />
                                                    {item.quantityInCrtn > 0 &&
                                                        ` ${item.quantityInCrtn} ctn${item.quantityInPcs > 0 ? "" : ""}`}
                                                </td>
                                                <td className="text-end">₹{item.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan="2" className="text-end">
                                            Grand Total
                                        </th>
                                        <th className="text-end">₹{grandTotal.toFixed(2)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceOrder;