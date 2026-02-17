import attemptTracker from '../utils/attemptTracker';

// Base configuration for API calls
const API_BASE_URL = 'https://fakestoreapi.com';

// Helper function to create fetch request with common configuration
const createFetchRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default fetch options
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // Note: fetch doesn't have built-in timeout, we'll implement it
  };

  // Merge options
  const fetchOptions = { ...defaultOptions, ...options };

  // Create AbortController for timeout functionality
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), fetchOptions.timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again later.');
    }
    
    throw error;
  }
};

// Product API functions
export const productAPI = {
  // Fetch all products with optional category filter
  async getProducts(category = null) {
    try {
      const endpoint = category ? `/products/category/${category}` : '/products';
      const products = await createFetchRequest(endpoint);
      
      // Transform the data to match our app's structure
      return products.map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        rating: {
          rate: product.rating?.rate || 0,
          count: product.rating?.count || 0,
        },
        stock: Math.floor(Math.random() * 50) + 10, // Generate random stock for demo
      }));
    } catch {
      throw new Error('Failed to fetch products. Please try again later.');
    }
  },

  // Fetch product categories
  async getCategories() {
    try {
      const categories = await createFetchRequest('/products/categories');
      return categories;
    } catch {
      throw new Error('Failed to fetch categories. Please try again later.');
    }
  },

  // Fetch single product by ID
  async getProduct(id) {
    try {
      const product = await createFetchRequest(`/products/${id}`);
      
      // Transform the data to match our app's structure
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        rating: {
          rate: product.rating?.rate || 0,
          count: product.rating?.count || 0,
        },
        stock: Math.floor(Math.random() * 50) + 10, // Generate random stock for demo
      };
    } catch {
      throw new Error('Failed to fetch product details. Please try again later.');
    }
  },

  // Search products (client-side search since API doesn't support it)
  searchProducts(products, searchTerm) {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.title.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  },

  // Filter products by category
  filterProductsByCategory(products, category) {
    if (!category || category === 'all') return products;
    return products.filter(product => product.category === category);
  },

  // Sort products
  sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch (sortBy) {
      case 'price-low':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'name':
        return sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
      case 'rating':
        return sortedProducts.sort((a, b) => b.rating.rate - a.rating.rate);
      default:
        return sortedProducts;
    }
  },
};

// Payment API functions (simulated) - implements fail/success pattern
export const paymentAPI = {
  // Simulate payment processing with realistic delays
  async processPayment(paymentData) {
    // Check if fail mode is enabled from navbar checkbox
    const failModeEnabled = attemptTracker.getFailMode();
    // Added log to trace payment flow and fail mode state for debugging network issues.
    console.log('[Payment] Starting processPayment', { failModeEnabled });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate payment validation
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
      throw new Error('Please fill in all payment details');
    }
    
    if (paymentData.cardNumber.length < 16) {
      throw new Error('Please enter a valid card number');
    }
    
    if (paymentData.cvv.length < 3) {
      throw new Error('Please enter a valid CVV');
    }
    
    // Generate error based on checkbox flag in navbar
    if (failModeEnabled) {
      // Call the original API and then intentionally trigger a genuine failing API
      // (non-2xx HTTP response) that tools can capture, while avoiding domain name failures.
      try {
        const response = await fetch('/api/payment/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });

        const contentType = response.headers.get('content-type') || '';
        console.log('[Payment][failMode] Real /api/payment/process response', {
          status: response.status,
          ok: response.ok,
          contentType,
        });

        // In production today this often returns 200 with index.html (text/html) instead of JSON.
        // To simulate a genuine failing API (non-2xx) that tools can capture, we call a real
        // HTTP endpoint that always returns an error status (e.g., 500). This avoids domain
        // name failures while still producing a realistic failing API call.
        if (response.ok && contentType.includes('text/html')) {
          console.error(
            '[Payment][failMode] Received HTML (likely index.html) from /api/payment/process; triggering simulated HTTP error request.',
          );
          const simulatedResponse = await fetch(
            'https://httpstat.us/500?reason=payment_fail_mode',
            {
              method: 'GET',
            },
          );
          console.log('[Payment][failMode] Simulated failure API status', {
            status: simulatedResponse.status,
            ok: simulatedResponse.ok,
          });
        }
      } catch (networkError) {
        // Network-level errors are still logged for debugging purposes.
        console.error(
          '[Payment][failMode] Error during fail-mode simulation (network or HTTP):',
          networkError,
        );
      }

      // Always surface a logical failure to the UI so behavior is consistent.
      throw new Error('Payment processing failed due to simulated server error. Please try again.');
    }
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      orderId,
      transactionId: `TXN-${Date.now()}`,
      amount: paymentData.amount,
      timestamp: new Date().toISOString(),
    };
  },
};

// Export the helper function for use in other parts of the app if needed
export { createFetchRequest };
