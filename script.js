// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const dealsContainer = document.getElementById('dealsContainer');
const startVoiceButton = document.getElementById('startVoice');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const notification = document.getElementById('notification');
const userEmailInput = document.getElementById('userEmail');
const subscribeButton = document.getElementById('subscribeEmail');
const emailForm = document.getElementById('emailForm');
const mainFeatures = document.getElementById('mainFeatures');
const emailSection = document.getElementById('emailSection');
const voiceStatus = document.getElementById('voiceStatus');

// OmniDimension API Configuration
const OMNIDIMENSION_API_KEY = 'Q7nxqouuAOB-s5UU-tNIW9f51enEtmrb-2mdE2XzvBs';
const OMNIDIMENSION_AGENT_ID = 'cgSgspJ2msm6clMCkdW9';
const OMNIDIMENSION_API_URL = 'https://api.omnidim.io/v1';

// Mock Data
let mockData = {
    concerts: [],
    sellers: []
};
let userEmail = null;

// Voice Assistant State
let voiceAssistantReady = false;

// Check if user has already subscribed
const hasSubscribed = localStorage.getItem('hasSubscribed');
if (hasSubscribed) {
    showMainFeatures();
}

// Handle Voice Assistant Script Error
window.handleVoiceAssistantError = function() {
    console.error('Failed to load voice assistant script');
    showNotification('Voice assistant is currently unavailable. Please try again later.', 'error');
    if (startVoiceButton) {
        startVoiceButton.disabled = true;
    }
    const chatBotButton = document.getElementById('chatBotButton');
    if (chatBotButton) {
        chatBotButton.disabled = true;
    }
};

// Show Notification Function
function showNotification(message, type = 'info') {
    const notificationElement = document.getElementById('notification');
    const notificationText = notificationElement?.querySelector('.notification-text');
    
    if (!notificationElement || !notificationText) {
        console.error('Notification elements not found');
        return;
    }

    notificationElement.className = `notification ${type}`;
    notificationText.textContent = message;
    notificationElement.classList.add('show');

    setTimeout(() => {
        notificationElement.classList.remove('show');
    }, 5000);
}

// Initialize Voice Assistant
function initializeVoiceAssistant() {
    if (window.OmniDimensionVoiceAssistant) {
        try {
            window.OmniDimensionVoiceAssistant.configure({
                agentId: OMNIDIMENSION_AGENT_ID,
                onStart: () => {
                    const statusDot = document.querySelector('.status-dot');
                    const statusText = document.querySelector('.status-text');
                    const startVoiceButton = document.getElementById('startVoice');

                    if (statusDot && statusText && startVoiceButton) {
                        statusDot.style.background = '#FFA500';
                        statusText.textContent = 'Listening...';
                        startVoiceButton.innerHTML = '<i class="fas fa-microphone"></i> Stop Voice Agent';
                    }
                    showNotification('Voice agent is ready to help you find tickets!', 'success');
                },
                onEnd: () => {
                    const statusDot = document.querySelector('.status-dot');
                    const statusText = document.querySelector('.status-text');
                    const startVoiceButton = document.getElementById('startVoice');

                    if (statusDot && statusText && startVoiceButton) {
                        statusDot.style.background = '#4CAF50';
                        statusText.textContent = 'Ready';
                        startVoiceButton.innerHTML = '<i class="fas fa-microphone"></i> Start Voice Agent';
                    }
                    showNotification('Voice agent session ended', 'info');
                },
                onError: (error) => {
                    console.error('Voice agent error:', error);
                    const statusDot = document.querySelector('.status-dot');
                    const statusText = document.querySelector('.status-text');
                    const startVoiceButton = document.getElementById('startVoice');

                    if (statusDot && statusText && startVoiceButton) {
                        statusDot.style.background = '#FF4444';
                        statusText.textContent = 'Error';
                        startVoiceButton.innerHTML = '<i class="fas fa-microphone"></i> Start Voice Agent';
                    }
                    showNotification('Error with voice agent. Please try again.', 'error');
                }
            });
            voiceAssistantReady = true;
            console.log('Voice assistant initialized successfully');
        } catch (error) {
            console.error('Error initializing voice assistant:', error);
            showNotification('Error initializing voice assistant. Please refresh the page.', 'error');
        }
    } else {
        console.warn('Voice assistant not loaded yet');
        // Try again after a short delay
        setTimeout(initializeVoiceAssistant, 1000);
    }
}

// Load mock data
async function loadMockData() {
    try {
        const response = await fetch('mock_concert_deals.json');
        if (!response.ok) {
            throw new Error('Failed to fetch mock data');
        }
        
        const concerts = await response.json();
        
        // Validate data structure
        if (!Array.isArray(concerts)) {
            throw new Error('Invalid mock data structure');
        }

        // Process concerts and extract sellers
        const processedConcerts = concerts.map(concert => ({
            id: concert.id,
            title: concert.title,
            artist: concert.artist,
            venue: concert.venue,
            date: concert.date,
            price: concert.price,
            category: concert.category,
            availableSeats: concert.availableSeats,
            description: concert.description,
            rating: concert.rating
        }));

        // Extract unique sellers from all concerts
        const sellerSet = new Set();
        const processedSellers = [];
        
        concerts.forEach(concert => {
            if (concert.offers && Array.isArray(concert.offers)) {
                concert.offers.forEach(offer => {
                    if (!sellerSet.has(offer.seller_name)) {
                        sellerSet.add(offer.seller_name);
                        processedSellers.push({
                            id: processedSellers.length + 1,
                            name: offer.seller_name,
                            price: offer.price,
                            deliveryTime: offer.delivery_time,
                            availability: offer.availability,
                            specialOffers: offer.special_offers,
                            rating: (Math.random() * 2 + 3).toFixed(1) // Random rating between 3-5
                        });
                    }
                });
            }
        });

        if (processedConcerts.length === 0 || processedSellers.length === 0) {
            throw new Error('No valid concerts or sellers found in mock data');
        }

        mockData = {
            concerts: processedConcerts,
            sellers: processedSellers
        };

        console.log('Mock data loaded successfully:', mockData);
    } catch (error) {
        console.error('Error loading mock data:', error);
        showNotification('Error loading concert data. Please refresh the page.', 'error');
        throw error;
    }
}

// Voice Recognition Setup
let recognition;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
} else {
    console.error('Speech recognition not supported');
    if (startVoiceButton) {
        startVoiceButton.disabled = true;
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners only if elements exist
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleSearch);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', handleSearch);
    }
    if (startVoiceButton) {
        startVoiceButton.addEventListener('click', startVoiceAssistant);
    }
    if (subscribeButton) {
        subscribeButton.addEventListener('click', handleEmailSubscription);
    }
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = userEmailInput?.value;
            
            try {
                // Show loading state
                const submitButton = document.getElementById('subscribeEmail');
                if (submitButton) {
                    const originalText = submitButton.textContent;
                    submitButton.textContent = 'Subscribing...';
                    submitButton.disabled = true;

                    // Simulate API call (replace with actual API call)
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Store subscription status
                    localStorage.setItem('hasSubscribed', 'true');
                    if (email) {
                        localStorage.setItem('userEmail', email);
                    }

                    // Show success message
                    showNotification('Successfully subscribed! Welcome to TicketScout!', 'success');
                    
                    // Show main features
                    showMainFeatures();

                    // Reset button state
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            } catch (error) {
                showNotification('Failed to subscribe. Please try again.', 'error');
            }
        });
    }

    // Initialize the application
    initializeVoiceAssistant();
    loadMockData().catch(error => {
        console.error('Failed to load mock data:', error);
        showNotification('Failed to load concert data. Please refresh the page.', 'error');
    });
});

// Email Subscription Handler
async function handleEmailSubscription() {
    const email = userEmailInput.value.trim();
    
    if (!email || !isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    try {
        userEmail = email;
        
        // Send email to OmniDimension for Zapier integration
        const response = await fetch(`${OMNIDIMENSION_API_URL}/webhooks/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OMNIDIMENSION_API_KEY}`
            },
            body: JSON.stringify({
                email: email,
                source: 'TicketScout',
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to register email');
        }

        showNotification('Email registered successfully! You will receive deal updates.', 'success');
        userEmailInput.value = '';
    } catch (error) {
        console.error('Error registering email:', error);
        showNotification('Error registering email. Please try again.', 'error');
    }
}

// Email validation helper
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Functions
async function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const sort = sortFilter.value;

    if (!searchTerm) {
        showNotification('Please enter a search term', 'warning');
        return;
    }

    if (!mockData) {
        await loadMockData();
    }

    try {
        let filteredConcerts = mockData.concerts.filter(concert => {
            const matchesSearch = concert.title.toLowerCase().includes(searchTerm) ||
                                concert.venue.toLowerCase().includes(searchTerm) ||
                                concert.artist.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || concert.category === category;
            return matchesSearch && matchesCategory;
        });

        // Sort concerts
        switch (sort) {
            case 'price-asc':
                filteredConcerts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredConcerts.sort((a, b) => b.price - a.price);
                break;
            case 'date':
                filteredConcerts.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
        }

        if (filteredConcerts.length === 0) {
            showNotification('No concerts found. Try a different search term.', 'warning');
            dealsContainer.innerHTML = '<p class="no-results">No concerts found</p>';
            return;
        }

        displayConcerts(filteredConcerts);
    } catch (error) {
        console.error('Error searching concerts:', error);
        showNotification('Error searching concerts. Please try again.', 'error');
    }
}

function displayConcerts(concerts) {
    dealsContainer.innerHTML = concerts.map(concert => `
        <div class="deal-card">
            <div class="deal-header">
                <h3>${concert.title}</h3>
                <span class="rating">
                    <i class="fas fa-star"></i> ${concert.rating}
                </span>
            </div>
            <div class="deal-details">
                <p class="price">
                    <i class="fas fa-tag"></i>
                    $${concert.price}
                </p>
                <p class="venue">
                    <i class="fas fa-map-marker-alt"></i>
                    ${concert.venue}
                </p>
                <p class="date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(concert.date).toLocaleDateString()}
                </p>
                <p class="seats">
                    <i class="fas fa-chair"></i>
                    ${concert.availableSeats} seats available
                </p>
            </div>
            <button class="select-deal" onclick="startVoiceAssistant('${concert.title}')">
                <i class="fas fa-microphone"></i>
                Start Voice Search
            </button>
        </div>
    `).join('');
}

async function startVoiceSearch(concertName = null) {
    if (recognition) {
        if (statusText.textContent === 'Listening...') {
            recognition.stop();
            return;
        }

        try {
            // Ensure mockData is loaded
            if (!mockData) {
                await loadMockData();
            }

            // Check if mockData was loaded successfully
            if (!mockData || !mockData.concerts || !mockData.sellers) {
                throw new Error('Failed to load concert data');
            }

            // Only search for specific concert if concertName is provided
            let selectedConcert = null;
            if (concertName) {
                selectedConcert = mockData.concerts.find(c => c.title === concertName);
                if (!selectedConcert) {
                    showNotification('Concert not found', 'error');
                    return;
                }
            }

            // Simulate seller negotiations
            const sellerDeals = mockData.sellers.map(seller => {
                // 30% chance of successful negotiation
                const hasDiscount = Math.random() < 0.3;
                const discount = hasDiscount ? Math.floor(Math.random() * 20) + 5 : 0;
                const finalPrice = hasDiscount ? Math.floor(seller.price * (1 - discount/100)) : seller.price;
                
                return {
                    seller,
                    finalPrice,
                    deliveryTime: seller.deliveryTime,
                    availability: seller.availability,
                    negotiationNotes: hasDiscount ? [`Successfully negotiated ${discount}% discount`] : seller.specialOffers
                };
            });

            const topDeals = findTopDeals(sellerDeals);
            displayTopDeals(topDeals);
            
            // Send deals to OmniDimension for processing
            if (userEmail) {
                await sendDealsToOmniDimension(selectedConcert, topDeals);
            }
            
            showNotification('Top deals found!', 'success');
        } catch (error) {
            console.error('Error searching sellers:', error);
            showNotification('Error searching sellers. Please try again.', 'error');
        }
    }
}

async function sendDealsToOmniDimension(concert, deals) {
    try {
        const response = await fetch(`${OMNIDIMENSION_API_URL}/webhooks/deals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OMNIDIMENSION_API_KEY}`
            },
            body: JSON.stringify({
                email: userEmail,
                concert: concert,
                deals: deals,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send deals to OmniDimension');
        }
    } catch (error) {
        console.error('Error sending deals to OmniDimension:', error);
        showNotification('Error sending deals. Please try again.', 'error');
    }
}

function findTopDeals(deals) {
    return deals
        .sort((a, b) => {
            if (a.finalPrice !== b.finalPrice) {
                return a.finalPrice - b.finalPrice;
            }
            return a.deliveryTime.localeCompare(b.deliveryTime);
        })
        .slice(0, 3);
}

function displayTopDeals(deals) {
    dealsContainer.innerHTML = `
        <h2>Top 3 Deals Found</h2>
        ${deals.map((deal, index) => `
            <div class="deal-card">
                <div class="deal-header">
                    <h3>${index + 1}. ${deal.seller.name}</h3>
                    <span class="rating">
                        <i class="fas fa-star"></i> ${deal.seller.rating}
                    </span>
                </div>
                <div class="deal-details">
                    <p class="price">
                        <i class="fas fa-tag"></i>
                        $${deal.finalPrice}
                    </p>
                    <p class="delivery">
                        <i class="fas fa-truck"></i>
                        ${deal.deliveryTime}
                    </p>
                    <p class="availability">
                        <i class="fas fa-check-circle"></i>
                        ${deal.availability}
                    </p>
                    ${deal.negotiationNotes ? `
                        <p class="notes">
                            <i class="fas fa-comment"></i>
                            ${deal.negotiationNotes.join(', ')}
                        </p>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    `;
}

// Start Voice Assistant Function
async function startVoiceAssistant(concertName = null) {
    if (!recognition) {
        showNotification('Speech recognition is not supported in your browser.', 'error');
        return;
    }

    try {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const startVoiceButton = document.getElementById('startVoice');

        if (!statusDot || !statusText || !startVoiceButton) {
            console.error('Voice assistant elements not found');
            return;
        }

        statusDot.style.background = '#FFA500';
        statusText.textContent = 'Listening...';
        startVoiceButton.innerHTML = '<i class="fas fa-microphone"></i> Stop Voice Agent';
        
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice input:', transcript);
            
            try {
                const response = await fetch(`${OMNIDIMENSION_API_URL}/agents/${OMNIDIMENSION_AGENT_ID}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OMNIDIMENSION_API_KEY}`
                    },
                    body: JSON.stringify({
                        message: transcript,
                        context: {
                            concertName: concertName,
                            userEmail: userEmail,
                            availableConcerts: mockData.concerts,
                            availableSellers: mockData.sellers
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to get response from voice assistant');
                }

                const result = await response.json();
                handleAssistantResponse(result);
            } catch (error) {
                console.error('Error processing voice input:', error);
                showNotification('Error processing voice input. Please try again.', 'error');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (statusDot && statusText && startVoiceButton) {
                statusDot.style.background = '#FF4444';
                statusText.textContent = 'Error';
                startVoiceButton.innerHTML = '<i class="fas fa-microphone"></i> Start Voice Agent';
            }
            showNotification('Error with voice recognition. Please try again.', 'error');
        };

        recognition.onend = () => {
            if (statusDot && statusText && startVoiceButton) {
                statusDot.style.background = '#4CAF50';
                statusText.textContent = 'Ready';
                startVoiceButton.innerHTML = '<i class="fas fa-microphone"></i> Start Voice Agent';
            }
        };

        recognition.start();
        showNotification('Voice agent is ready to help you find tickets!', 'success');
    } catch (error) {
        console.error('Error starting voice assistant:', error);
        showNotification('Error starting voice assistant. Please try again.', 'error');
    }
}

// Handle Assistant Response
function handleAssistantResponse(result) {
    try {
        if (result.action === 'search') {
            searchInput.value = result.query;
            handleSearch();
        } else if (result.action === 'show_deals') {
            displayTopDeals(result.deals);
        } else if (result.action === 'notify') {
            showNotification(result.message, result.type || 'info');
        }
    } catch (error) {
        console.error('Error handling assistant response:', error);
        showNotification('Error processing assistant response. Please try again.', 'error');
    }
}

// Show Main Features
function showMainFeatures() {
    emailSection.style.display = 'none';
    mainFeatures.classList.remove('hidden');
    mainFeatures.style.display = 'block';
} 