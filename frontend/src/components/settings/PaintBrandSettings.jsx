import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Palette, 
  DollarSign,
  Package,
  Droplets,
  Info,
  Star,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PaintBrandSettings = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('brands');
  
  // Paint brands state
  const [paintBrands, setPaintBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  
  // Paint products state
  const [paintProducts, setPaintProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Material costs state
  const [materialCosts, setMaterialCosts] = useState({
    brush_4_inch: 8.50,
    brush_2_inch: 6.50,
    roller_9_inch: 12.00,
    roller_4_inch: 8.00,
    sandpaper_pack: 15.00,
    masking_tape_roll: 4.50,
    dust_sheet_large: 8.00,
    dust_sheet_medium: 5.50,
    filler_tube: 3.50,
    primer_undercoat: 22.00,
    turpentine_1l: 12.00,
    cleaning_materials: 10.00
  });

  // Coverage rates state
  const [coverageRates, setCoverageRates] = useState({
    emulsion_per_litre: 12, // m² per litre
    gloss_per_litre: 14,
    undercoat_per_litre: 11,
    masonry_per_litre: 8,
    wood_stain_per_litre: 16,
    varnish_per_litre: 15
  });

  const [loading, setLoading] = useState({
    brands: false,
    products: false,
    materials: false,
    coverage: false
  });

  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState({});

  useEffect(() => {
    loadPaintSettings();
  }, []);

  const loadPaintSettings = async () => {
    try {
      // Load paint brands
      const brandsResponse = await api.get('/settings/paint-brands');
      setPaintBrands(brandsResponse.data.brands || getDefaultBrands());
      setSelectedBrand(company?.preferred_paint_brand || 'Dulux');

      // Load paint products
      const productsResponse = await api.get('/settings/paint-products');
      setPaintProducts(productsResponse.data.products || getDefaultProducts());

      // Load material costs
      const materialsResponse = await api.get('/settings/material-costs');
      if (materialsResponse.data.costs) {
        setMaterialCosts({ ...materialCosts, ...materialsResponse.data.costs });
      }

      // Load coverage rates
      const coverageResponse = await api.get('/settings/coverage-rates');
      if (coverageResponse.data.rates) {
        setCoverageRates({ ...coverageRates, ...coverageResponse.data.rates });
      }
    } catch (err) {
      console.log('Loading default paint settings');
    }
  };

  const getDefaultBrands = () => [
    { id: 1, name: 'Dulux', popular: true },
    { id: 2, name: 'Farrow & Ball', popular: true },
    { id: 3, name: 'Crown', popular: true },
    { id: 4, name: "Johnstone's", popular: false },
    { id: 5, name: 'Benjamin Moore', popular: false },
    { id: 6, name: 'Sherwin Williams', popular: false },
    { id: 7, name: 'Little Greene', popular: false },
    { id: 8, name: 'Zinsser', popular: false }
  ];

  const getDefaultProducts = () => [
    {
      id: 1,
      brand: 'Dulux',
      name: 'Emulsion Paint',
      type: 'emulsion',
      finish: 'matt',
      price_per_litre: 24.99,
      coverage_per_litre: 12,
      suitable_for: ['walls', 'ceilings'],
      popular: true
    },
    {
      id: 2,
      brand: 'Dulux',
      name: 'Gloss Paint',
      type: 'gloss',
      finish: 'gloss',
      price_per_litre: 28.99,
      coverage_per_litre: 14,
      suitable_for: ['woodwork', 'metal'],
      popular: true
    },
    {
      id: 3,
      brand: 'Dulux',
      name: 'Undercoat',
      type: 'undercoat',
      finish: 'matt',
      price_per_litre: 22.99,
      coverage_per_litre: 11,
      suitable_for: ['preparation'],
      popular: false
    }
  ];

  const addPaintProduct = () => {
    const newProduct = {
      id: Date.now(),
      brand: selectedBrand,
      name: '',
      type: 'emulsion',
      finish: 'matt',
      price_per_litre: 0,
      coverage_per_litre: 12,
      suitable_for: ['walls'],
      popular: false
    };
    setPaintProducts([...paintProducts, newProduct]);
    setEditingProduct(newProduct.id);
  };

  const updatePaintProduct = (id, field, value) => {
    setPaintProducts(products =>
      products.map(product =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  };

  const removePaintProduct = (id) => {
    setPaintProducts(products => products.filter(product => product.id !== id));
    if (editingProduct === id) {
      setEditingProduct(null);
    }
  };

  const handleSaveBrands = async () => {
    setLoading(prev => ({ ...prev, brands: true }));
    setErrors(prev => ({ ...prev, brands: '' }));
    
    try {
      await api.put('/settings/paint-brands', {
        brands: paintBrands,
        preferred_brand: selectedBrand
      });
      
      setSuccessMessages(prev => ({ ...prev, brands: 'Brand settings saved!' }));
      setTimeout(() => setSuccessMessages(prev => ({ ...prev, brands: '' })), 3000);
    } catch (err) {
      setErrors(prev => ({ ...prev, brands: 'Failed to save brand settings' }));
    } finally {
      setLoading(prev => ({ ...prev, brands: false }));
    }
  };

  const handleSaveProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    setErrors(prev => ({ ...prev, products: '' }));
    
    try {
      await api.put('/settings/paint-products', { products: paintProducts });
      setSuccessMessages(prev => ({ ...prev, products: 'Product settings saved!' }));
      setTimeout(() => setSuccessMessages(prev => ({ ...prev, products: '' })), 3000);
    } catch (err) {
      setErrors(prev => ({ ...prev, products: 'Failed to save product settings' }));
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleSaveMaterials = async () => {
    setLoading(prev => ({ ...prev, materials: true }));
    setErrors(prev => ({ ...prev, materials: '' }));
    
    try {
      await api.put('/settings/material-costs', { costs: materialCosts });
      setSuccessMessages(prev => ({ ...prev, materials: 'Material costs saved!' }));
      setTimeout(() => setSuccessMessages(prev => ({ ...prev, materials: '' })), 3000);
    } catch (err) {
      setErrors(prev => ({ ...prev, materials: 'Failed to save material costs' }));
    } finally {
      setLoading(prev => ({ ...prev, materials: false }));
    }
  };

  const handleSaveCoverage = async () => {
    setLoading(prev => ({ ...prev, coverage: true }));
    setErrors(prev => ({ ...prev, coverage: '' }));
    
    try {
      await api.put('/settings/coverage-rates', { rates: coverageRates });
      setSuccessMessages(prev => ({ ...prev, coverage: 'Coverage rates saved!' }));
      setTimeout(() => setSuccessMessages(prev => ({ ...prev, coverage: '' })), 3000);
    } catch (err) {
      setErrors(prev => ({ ...prev, coverage: 'Failed to save coverage rates' }));
    } finally {
      setLoading(prev => ({ ...prev, coverage: false }));
    }
  };

  const tabs = [
    { id: 'brands', name: 'Paint Brands', icon: Palette },
    { id: 'products', name: 'Products & Pricing', icon: Package },
    { id: 'materials', name: 'Material Costs', icon: DollarSign },
    { id: 'coverage', name: 'Coverage Rates', icon: Droplets }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/settings')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-700 flex items-center">
            <Palette className="h-8 w-8 mr-3" />
            Paint & Material Settings
          </h1>
        </div>
        <p className="text-gray-600 mt-2">
          Configure paint brands, products, pricing, and material costs for accurate quotes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Paint Brands Tab */}
      {activeTab === 'brands' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-purple-700">Preferred Paint Brands</h3>
            <button
              onClick={handleSaveBrands}
              disabled={loading.brands}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
            >
              {loading.brands ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>

          {errors.brands && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{errors.brands}</p>
            </div>
          )}

          {successMessages.brands && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{successMessages.brands}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Paint Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {paintBrands.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name} {brand.popular && '⭐'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Available Brands</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paintBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className={`p-4 border-2 rounded-lg text-center transition-colors cursor-pointer ${
                      selectedBrand === brand.name
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBrand(brand.name)}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Palette className="h-6 w-6 text-purple-600" />
                      {brand.popular && <Star className="h-4 w-4 text-yellow-500 ml-1" />}
                    </div>
                    <span className="text-sm font-medium">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products & Pricing Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-purple-700">Paint Products & Pricing</h3>
              <div className="flex space-x-3">
                <button
                  onClick={addPaintProduct}
                  className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </button>
                <button
                  onClick={handleSaveProducts}
                  disabled={loading.products}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
                >
                  {loading.products ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>

            {errors.products && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-sm text-red-600">{errors.products}</p>
              </div>
            )}

            {successMessages.products && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-sm text-green-600">{successMessages.products}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/Litre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coverage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paintProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => updatePaintProduct(product.id, 'name', e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                              placeholder="Product name"
                            />
                            <select
                              value={product.brand}
                              onChange={(e) => updatePaintProduct(product.id, 'brand', e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              {paintBrands.map((brand) => (
                                <option key={brand.id} value={brand.name}>
                                  {brand.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.brand}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <select
                            value={product.type}
                            onChange={(e) => updatePaintProduct(product.id, 'type', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="emulsion">Emulsion</option>
                            <option value="gloss">Gloss</option>
                            <option value="undercoat">Undercoat</option>
                            <option value="primer">Primer</option>
                            <option value="masonry">Masonry</option>
                            <option value="wood_stain">Wood Stain</option>
                            <option value="varnish">Varnish</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900 capitalize">{product.type}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={product.price_per_litre}
                            onChange={(e) => updatePaintProduct(product.id, 'price_per_litre', parseFloat(e.target.value))}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="0.00"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">€{product.price_per_litre?.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={product.coverage_per_litre}
                            onChange={(e) => updatePaintProduct(product.id, 'coverage_per_litre', parseFloat(e.target.value))}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="12"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{product.coverage_per_litre} m²/L</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {editingProduct === product.id ? (
                            <button
                              onClick={() => setEditingProduct(null)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingProduct(product.id)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removePaintProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Material Costs Tab */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-purple-700">Material Costs</h3>
            <button
              onClick={handleSaveMaterials}
              disabled={loading.materials}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
            >
              {loading.materials ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>

          {errors.materials && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{errors.materials}</p>
            </div>
          )}

          {successMessages.materials && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{successMessages.materials}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(materialCosts).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setMaterialCosts(prev => ({
                    ...prev,
                    [key]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage Rates Tab */}
      {activeTab === 'coverage' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-purple-700">Coverage Rates</h3>
            <button
              onClick={handleSaveCoverage}
              disabled={loading.coverage}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
            >
              {loading.coverage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>

          {errors.coverage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{errors.coverage}</p>
            </div>
          )}

          {successMessages.coverage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{successMessages.coverage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(coverageRates).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (m²/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => setCoverageRates(prev => ({
                    ...prev,
                    [key]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Coverage Rate Guidelines</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• Emulsion: Typically 10-14 m² per litre depending on surface</li>
                  <li>• Gloss: Usually 12-16 m² per litre on prepared surfaces</li>
                  <li>• Undercoat: Generally 10-12 m² per litre</li>
                  <li>• Masonry: Around 6-10 m² per litre on textured surfaces</li>
                  <li>• Coverage may vary based on surface porosity and application method</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">💡 Paint & Material Settings Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Update prices regularly to ensure accurate quotes</li>
          <li>• Set your preferred brand as default for new projects</li>
          <li>• Material costs are used for comprehensive quote calculations</li>
          <li>• Coverage rates help estimate paint quantities needed</li>
          <li>• Consider adding markup percentages to cover business costs</li>
          <li>• Test coverage rates on actual projects and adjust as needed</li>
        </ul>
      </div>
    </div>
  );
};

export default PaintBrandSettings;