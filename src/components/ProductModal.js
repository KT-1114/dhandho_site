import React, { useState } from 'react';
import supabase from '../supabaseClient';
import Toast from '../components/Toast';
import { useAuth } from '../components/AuthProvider';

const ProductModal = ({ showModal, onClose }) => {
    const [baseProductName, setBaseProductName] = useState('');
    const [isSoldInPieces, setIsSoldInPieces] = useState(false);
    const [useSingleImage, setUseSingleImage] = useState(true);
    const [sizes, setSizes] = useState([{
        measurement: '',
        unit: 'gm',
        rate: '',
        mrp: '',
        costPrice: '',
        quantityInCarton: '',
        currentCartons: '',
        currentPieces: '',
        image: null
    }]);
    const [productImage, setProductImage] = useState(null);
    const { userBusinessData } = useAuth();
    const [toast, setToast] = useState({ type: '', message: '', show: false });

    const handleSizeChange = (index, field, value) => {
        const updatedSizes = [...sizes];

        if (!isSoldInPieces && field === 'currentPieces' && parseFloat(value) >= updatedSizes[index].quantityInCarton) {
            setToast({
                type: 'warning',
                message: `For size ${index + 1}, current pieces cannot be greater than or equal to the quantity in carton.`,
                show: true
            });
            setTimeout(() => setToast({ ...toast, show: false }), 5000);
            return;
        }

        updatedSizes[index][field] = value;
        setSizes(updatedSizes);
    };

    const handleAddSize = () => {
        setSizes([...sizes, {
            measurement: '',
            unit: 'gm',
            rate: '',
            mrp: '',
            costPrice: '',
            quantityInCarton: '',
            currentCartons: '',
            currentPieces: '',
            image: null
        }]);
    };

    const handleRemoveSize = (index) => {
        if (sizes.length > 1) {
            const updatedSizes = [...sizes];
            updatedSizes.splice(index, 1);
            setSizes(updatedSizes);
        }
    };

    const handleImageChange = (e, index = null) => {
        const file = e.target.files[0];
        if (useSingleImage) {
            setProductImage(file);
        } else {
            const updatedSizes = [...sizes];
            updatedSizes[index].image = file;
            setSizes(updatedSizes);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        let uploadedImageUrl = null;
        let imageFilePath = null;

        if (useSingleImage && productImage) {
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(`${userBusinessData.business_uid}_${baseProductName}`, productImage);

            if (error) {
                setToast({
                    type: 'danger',
                    message: `Error uploading image: ${error.message}`,
                    show: true
                });
                setTimeout(() => setToast({ ...toast, show: false }), 5000);
                return;
            }

            uploadedImageUrl = data.path;
            imageFilePath = data.path;
        }

        try {
            const productsToAdd = await Promise.all(
                sizes.map(async (size, index) => {
                    let sizeImageUrl = uploadedImageUrl;

                    if (!userBusinessData) {
                        setToast({
                            type: 'warning',
                            message: 'User business not found.',
                            show: true
                        });
                        setTimeout(() => setToast({ ...toast, show: false }), 5000);
                        return;
                    }

                    const productName = `${baseProductName} (${size.measurement}) ${size.unit}`;

                    if (!useSingleImage && size.image) {
                        const { data, error } = await supabase.storage
                            .from('product-images')
                            .upload(`${userBusinessData.business_uid}_${productName}_${size.measurement}`, size.image);

                        if (error) {
                            setToast({
                                type: 'danger',
                                message: `Error uploading size ${index + 1} image: ${error.message}`,
                                show: true
                            });
                            setTimeout(() => setToast({ ...toast, show: false }), 5000);
                            return;
                        }

                        sizeImageUrl = data.path;
                    }
                    console.log('sizeImageUrl', sizeImageUrl)

                    const { error } = await supabase.rpc('add_product_and_initialize_inventory', {
                        p_product_name: productName,
                        p_rate: size.rate,
                        p_mrp: size.mrp,
                        p_cost_price: size.costPrice,
                        p_qty_in_ctn: isSoldInPieces ? null : size.quantityInCarton,
                        p_image_url: sizeImageUrl,
                        p_seller_uid: userBusinessData.business_uid,
                        p_initial_pieces: size.currentPieces || 0,
                        p_initial_cartons: size.currentCartons || 0
                    });

                    if (error) {
                        setToast({
                            type: 'danger',
                            message: `Error adding product: ${error.message}`,
                            show: true
                        });
                        setTimeout(() => setToast({ ...toast, show: false }), 5000);
                        return;
                    }

                    return {
                        product_name: productName,
                        rate: size.rate,
                        mrp: size.mrp,
                        cost_price: size.costPrice,
                        qty_in_ctn: isSoldInPieces ? null : size.quantityInCarton,
                        image_url: sizeImageUrl,
                        seller_uid: userBusinessData.business_uid
                    };
                })
            );

            setToast({ type: 'success', message: 'Products added successfully!', show: true });
            setTimeout(() => setToast({ ...toast, show: false }), 5000);

            setBaseProductName('');
            setIsSoldInPieces(false);
            setUseSingleImage(true);
            setSizes([{
                measurement: '',
                unit: 'gm',
                rate: '',
                mrp: '',
                costPrice: '',
                quantityInCarton: '',
                currentCartons: '',
                currentPieces: '',
                image: null
            }]);
            setProductImage(null);
            onClose(); // Close the modal after success

        } catch (error) {
            setToast({ type: 'danger', message: `Unexpected error: ${error.message}`, show: true });
            setTimeout(() => setToast({ ...toast, show: false }), 5000);

            if (imageFilePath) {
                await supabase.storage
                    .from('product-images')
                    .remove([imageFilePath]);
            }
        }
    };

    const handleToggleSoldInPieces = () => {
        setIsSoldInPieces(prevState => {
            const newState = !prevState;

            if (!newState) {
                const updatedSizes = sizes.map(size => ({
                    ...size,
                    currentPieces: ''
                }));
                setSizes(updatedSizes);
            }

            return newState;
        });
    };

    return (
        <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex="-1" aria-hidden={!showModal}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add New Product</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-5 text-center">
                            <h3 style={{ fontSize: '24px', fontWeight: '600' }}>Add New Product</h3>
                        </div>
                        <div className="form-group mb-4">
                            <input
                                type="text"
                                id="productName"
                                value={baseProductName}
                                onChange={(e) => setBaseProductName(e.target.value)}
                                className="form-control floating-input"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="productName" className="floating-label">Product Name</label>
                        </div>

                        <div className="form-check form-switch mb-4">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="useSingleImage"
                                checked={useSingleImage}
                                onChange={(e) => setUseSingleImage(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="useSingleImage">
                                Use Single Image for All Sizes
                            </label>
                        </div>

                        <div className="form-check form-switch mb-4">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="isSoldInPieces"
                                checked={isSoldInPieces}
                                onChange={handleToggleSoldInPieces}
                            />
                            <label className="form-check-label" htmlFor="isSoldInPieces">
                                Sold in Pieces Only
                            </label>
                        </div>

                        {useSingleImage && (
                            <div className="form-group mb-4">
                                <input
                                    type="file"
                                    className="form-control file-control"
                                    id="productImage"
                                    onChange={(e) => handleImageChange(e)}
                                />
                                <label htmlFor="productImage" className="file-label">Product Image</label>
                            </div>
                        )}

                        {sizes.map((size, index) => (
                            <div key={index} className="mb-5 p-4 border rounded-3 shadow-sm bg-light position-relative">
                                <h5 style={{ fontSize: '20px', fontWeight: '500' }}>Size {index + 1}</h5>
                                <button
                                    type="button"
                                    className="btn btn-link d-flex position-absolute top-0 end-0 me-2 mt-2 w-auto text-decoration-none"
                                    onClick={() => handleRemoveSize(index)}
                                    style={{ fontSize: '1.5rem', color: '#f44336' }}
                                    disabled={sizes.length === 1}
                                >
                                    <i className="bx bx-minus-circle" />
                                </button>

                                <div className="row">
                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <input
                                            type="text"
                                            id={`size-${index}-measurement`}
                                            value={size.measurement}
                                            onChange={(e) => handleSizeChange(index, 'measurement', e.target.value)}
                                            className="form-control floating-input"
                                            placeholder=" "
                                            required
                                        />
                                        <label htmlFor={`size-${index}-measurement`} className="floating-label">Measurement</label>
                                    </div>

                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <select
                                            className="form-select select-control"
                                            id={`size-${index}-unit`}
                                            value={size.unit}
                                            onChange={(e) => handleSizeChange(index, 'unit', e.target.value)}
                                            required
                                        >
                                            <option value="gm">gm</option>
                                            <option value="kg">kg</option>
                                            <option value="ltr">ltr</option>
                                            <option value="pcs">pcs</option>
                                            <option value="doz">dozen</option>
                                            <option value="ml">ml</option>
                                            <option value="cm">cm</option>
                                            <option value="m">m</option>
                                            <option value="box">box</option>
                                            <option value="pack">pack</option>
                                            <option value="roll">roll</option>
                                            <option value="yard">yard</option>
                                            <option value="sqft">sq ft</option>
                                        </select>
                                        <label htmlFor={`size-${index}-unit`} className="select-label">Unit</label>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <input
                                            type="number"
                                            id={`size-${index}-rate`}
                                            value={size.rate}
                                            onChange={(e) => handleSizeChange(index, 'rate', e.target.value)}
                                            className="form-control floating-input"
                                            placeholder=" "
                                            required
                                            min="0"
                                            style={{ appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                        />
                                        <label htmlFor={`size-${index}-rate`} className="floating-label">Rate</label>
                                    </div>

                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <input
                                            type="number"
                                            id={`size-${index}-mrp`}
                                            value={size.mrp}
                                            onChange={(e) => handleSizeChange(index, 'mrp', e.target.value)}
                                            className="form-control floating-input"
                                            placeholder=" "
                                            required
                                            min="0"
                                            style={{ appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                        />
                                        <label htmlFor={`size-${index}-mrp`} className="floating-label">MRP</label>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <input
                                            type="number"
                                            id={`size-${index}-costPrice`}
                                            value={size.costPrice}
                                            onChange={(e) => handleSizeChange(index, 'costPrice', e.target.value)}
                                            className="form-control floating-input"
                                            placeholder=" "
                                            required
                                            min="0"
                                            style={{ appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                        />
                                        <label htmlFor={`size-${index}-costPrice`} className="floating-label">Cost Price</label>
                                    </div>

                                    {!isSoldInPieces && (
                                        <div className="col-12 col-md-6 form-group mb-4">
                                            <input
                                                type="number"
                                                id={`size-${index}-quantityInCarton`}
                                                value={size.quantityInCarton}
                                                onChange={(e) => handleSizeChange(index, 'quantityInCarton', e.target.value)}
                                                className="form-control floating-input"
                                                placeholder=" "
                                                required
                                                min="0"
                                                style={{ appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                            />
                                            <label htmlFor={`size-${index}-quantityInCarton`} className="floating-label">Qty in Carton</label>
                                        </div>
                                    )}
                                </div>

                                {!useSingleImage && (
                                    <div className="form-group mb-4">
                                        <input
                                            type="file"
                                            className="form-control file-control"
                                            id={`size-${index}-image`}
                                            onChange={(e) => handleImageChange(e, index)}
                                        />
                                        <label htmlFor={`size-${index}-image`} className="file-label">Size {index + 1} Image</label>
                                    </div>
                                )}

                                <div className="row">
                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <input
                                            type="number"
                                            id={`size-${index}-currentPieces`}
                                            value={size.currentPieces}
                                            onChange={(e) => handleSizeChange(index, 'currentPieces', e.target.value)}
                                            className="form-control floating-input"
                                            placeholder=" "
                                            min="0"
                                        />
                                        <label htmlFor={`size-${index}-currentPieces`} className="floating-label">Current Pieces</label>
                                    </div>
                                    <div className="col-12 col-md-6 form-group mb-4">
                                        <input
                                            type="number"
                                            id={`size-${index}-currentCartons`}
                                            value={size.currentCartons}
                                            onChange={(e) => handleSizeChange(index, 'currentCartons', e.target.value)}
                                            className="form-control floating-input"
                                            placeholder=" "
                                            min="0"
                                        />
                                        <label htmlFor={`size-${index}-currentCartons`} className="floating-label">Current Cartons</label>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn btn-link d-block mx-auto mb-4" onClick={handleAddSize} style={{ fontSize: '2rem', color: '#4CAF50' }}>
                            <i className="bx bx-plus-circle" />
                        </button>

                        <div className="form-group text-center">
                            <button type="submit" className="btn btn-primary btn-lg">Submit</button>
                        </div>
                    </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
