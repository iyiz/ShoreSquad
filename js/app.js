/**
 * ShoreSquad App
 * Beach cleanup community platform
 * Features: Event management, weather integration, social features
 */

// ============================================
// STATE MANAGEMENT
// ============================================

const AppState = {
    events: [],
    currentUser: {
        name: localStorage.getItem('userName') || 'Crew Member',
        eventsJoined: JSON.parse(localStorage.getItem('eventsJoined')) || [],
    },
    stats: {
        activeEvents: 0,
        members: 237, // Demo data
        trashCollected: 1540, // Demo data in lbs
    },
};

// ============================================
// DOM REFERENCES
// ============================================

const DOM = {
    sections: document.querySelectorAll('.section'),
    navLinks: document.querySelectorAll('.nav-link'),
    navMenu: document.querySelector('.nav-menu'),
    hamburger: document.querySelector('.hamburger'),
    eventForm: document.getElementById('eventForm'),
    eventsList: document.getElementById('eventsList'),
    emptyState: document.getElementById('emptyState'),
    eventCount: document.getElementById('eventCount'),
    memberCount: document.getElementById('memberCount'),
    trashCount: document.getElementById('trashCount'),
    searchInput: document.getElementById('searchInput'),
    weatherFilter: document.getElementById('weatherFilter'),
    exploreBtn: document.getElementById('exploreBtn'),
    createBtn: document.getElementById('createBtn'),
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadEventsFromStorage();
    setupEventListeners();
    renderDemoEvents();
    updateStats();
    setMinDateToToday();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation
    DOM.hamburger.addEventListener('click', toggleMobileMenu);
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // CTA Buttons
    DOM.exploreBtn.addEventListener('click', () => navigateToSection('events'));
    DOM.createBtn.addEventListener('click', () => navigateToSection('create'));

    // Form
    DOM.eventForm.addEventListener('submit', handleFormSubmit);

    // Search & Filter
    DOM.searchInput.addEventListener('input', debounce(filterEvents, 300));
    DOM.weatherFilter.addEventListener('change', filterEvents);
}

// ============================================
// NAVIGATION & ROUTING
// ============================================

function handleNavClick(e) {
    e.preventDefault();
    const section = e.target.dataset.section;
    navigateToSection(section);
    closeMobileMenu();
}

function navigateToSection(sectionName) {
    // Update active section
    DOM.sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');

    // Update active nav link
    DOM.navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) activeLink.classList.add('active');
}

function toggleMobileMenu() {
    DOM.navMenu.classList.toggle('active');
    DOM.hamburger.classList.toggle('active');
}

function closeMobileMenu() {
    DOM.navMenu.classList.remove('active');
    DOM.hamburger.classList.remove('active');
}

// ============================================
// FORM HANDLING
// ============================================

function handleFormSubmit(e) {
    e.preventDefault();

    // Collect form data
    const eventData = {
        id: Date.now(),
        name: document.getElementById('eventName').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        capacity: document.getElementById('eventCapacity').value || null,
        difficulty: document.getElementById('eventDifficulty').value,
        participants: [AppState.currentUser.name],
        weather: getRandomWeather(),
        createdBy: AppState.currentUser.name,
        createdAt: new Date().toISOString(),
    };

    // Validate
    if (!validateEvent(eventData)) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Add to state and storage
    AppState.events.unshift(eventData);
    saveEventsToStorage();
    updateStats();

    // Reset form
    DOM.eventForm.reset();
    showAlert(`Event "${eventData.name}" created successfully!`, 'success');

    // Navigate to events
    setTimeout(() => navigateToSection('events'), 1000);
}

function validateEvent(event) {
    return event.name && event.date && event.time && event.location;
}

function setMinDateToToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').setAttribute('min', today);
}

// ============================================
// EVENT MANAGEMENT
// ============================================

function renderDemoEvents() {
    const demoEvents = [
        {
            id: 1,
            name: 'Sunset Beach Cleanup',
            date: '2025-12-15',
            time: '17:00',
            location: 'Sunset Beach, CA',
            description: 'Evening cleanup with a beautiful ocean view. Bring your crew!',
            capacity: 50,
            difficulty: 'easy',
            participants: ['Alex', 'Jordan', 'Casey', 'Morgan'],
            weather: 'sunny',
            createdBy: 'Alex',
            createdAt: new Date().toISOString(),
        },
        {
            id: 2,
            name: 'Marina Bay Deep Clean',
            date: '2025-12-20',
            time: '09:00',
            location: 'Marina Bay, CA',
            description: 'Early morning cleanup. We\'ll tackle the rocky areas.',
            capacity: 75,
            difficulty: 'moderate',
            participants: ['Taylor', 'Riley', 'Sam', 'Chris', 'Pat'],
            weather: 'cloudy',
            createdBy: 'Taylor',
            createdAt: new Date().toISOString(),
        },
        {
            id: 3,
            name: 'Coral Reef Restoration',
            date: '2025-12-22',
            time: '14:00',
            location: 'Coral Cove, HI',
            description: 'Advanced cleanup focused on protecting marine life.',
            capacity: 30,
            difficulty: 'challenging',
            participants: ['Jordan', 'Phoenix'],
            weather: 'sunny',
            createdBy: 'Jordan',
            createdAt: new Date().toISOString(),
        },
    ];

    // Only add demo events if no events exist
    if (AppState.events.length === 0) {
        AppState.events = demoEvents;
        saveEventsToStorage();
    }

    renderEvents(AppState.events);
}

function renderEvents(events) {
    if (events.length === 0) {
        DOM.eventsList.innerHTML = '';
        DOM.emptyState.style.display = 'block';
        return;
    }

    DOM.emptyState.style.display = 'none';
    DOM.eventsList.innerHTML = events
        .map(event => createEventCardHTML(event))
        .join('');

    // Add event listeners to join buttons
    document.querySelectorAll('.btn-join').forEach(btn => {
        btn.addEventListener('click', handleJoinEvent);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', handleRemoveEvent);
    });
}

function createEventCardHTML(event) {
    const isJoined = AppState.currentUser.eventsJoined.includes(event.id);
    const isFull = event.capacity && event.participants.length >= event.capacity;
    const buttonText = isJoined ? 'Leave Event' : 'Join Event';
    const buttonClass = isJoined ? 'btn-remove' : 'btn-join';
    const buttonState = isFull && !isJoined ? 'disabled' : '';
    const joinButtonHTML = isFull && !isJoined
        ? '<button class="btn btn-small btn-tertiary" disabled>Event Full</button>'
        : `<button class="btn btn-small ${buttonClass} btn-success" data-id="${event.id}" ${buttonState}>${buttonText}</button>`;

    return `
        <div class="event-card">
            <div class="event-header">
                <div>
                    <div class="event-date">${formatDate(event.date)}</div>
                    <h3 class="event-title">${escapeHTML(event.name)}</h3>
                </div>
                <div class="event-weather">
                    ${getWeatherIcon(event.weather)} ${capitalizeText(event.weather)}
                </div>
            </div>
            <div class="event-body">
                <div class="event-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHTML(event.location)}</span>
                </div>
                <div class="event-info">
                    <i class="fas fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="event-info">
                    <i class="fas fa-signal"></i>
                    <span>${capitalizeText(event.difficulty)}</span>
                </div>
                <p class="event-description">${escapeHTML(event.description || 'No description provided')}</p>
                <div class="event-footer">
                    <div class="members-count">
                        <i class="fas fa-users"></i>
                        ${event.participants.length}${event.capacity ? '/' + event.capacity : ''} going
                    </div>
                    ${joinButtonHTML}
                </div>
            </div>
        </div>
    `;
}

function handleJoinEvent(e) {
    const eventId = parseInt(e.target.dataset.id);
    if (!AppState.currentUser.eventsJoined.includes(eventId)) {
        AppState.currentUser.eventsJoined.push(eventId);

        const event = AppState.events.find(e => e.id === eventId);
        if (event) {
            event.participants.push(AppState.currentUser.name);
        }

        saveUserToStorage();
        saveEventsToStorage();
        filterEvents();
        showAlert('You joined the event! 🎉', 'success');
    }
}

function handleRemoveEvent(e) {
    const eventId = parseInt(e.target.dataset.id);
    AppState.currentUser.eventsJoined = AppState.currentUser.eventsJoined.filter(id => id !== eventId);

    const event = AppState.events.find(e => e.id === eventId);
    if (event) {
        event.participants = event.participants.filter(name => name !== AppState.currentUser.name);
    }

    saveUserToStorage();
    saveEventsToStorage();
    filterEvents();
    showAlert('You left the event', 'success');
}

// ============================================
// FILTERING & SEARCH
// ============================================

function filterEvents() {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const weatherFilter = DOM.weatherFilter.value;

    const filtered = AppState.events.filter(event => {
        const matchesSearch =
            event.name.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm);
        const matchesWeather = !weatherFilter || event.weather === weatherFilter;

        return matchesSearch && matchesWeather;
    });

    renderEvents(filtered);
}

// ============================================
// STATS & DISPLAY
// ============================================

function updateStats() {
    AppState.stats.activeEvents = AppState.events.length;
    AppState.stats.members = 237 + Math.floor(AppState.currentUser.eventsJoined.length * 0.5);

    DOM.eventCount.textContent = AppState.stats.activeEvents;
    DOM.memberCount.textContent = AppState.stats.members;
    DOM.trashCount.textContent = AppState.stats.trashCollected;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

function capitalizeText(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function getRandomWeather() {
    const weathers = ['sunny', 'cloudy', 'rainy'];
    return weathers[Math.floor(Math.random() * weathers.length)];
}

function getWeatherIcon(weather) {
    const icons = {
        sunny: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
    };
    return icons[weather] || '🌤️';
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    // Insert at top of main
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        alertDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 4000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveEventsToStorage() {
    localStorage.setItem('shoreSquadEvents', JSON.stringify(AppState.events));
}

function loadEventsFromStorage() {
    const stored = localStorage.getItem('shoreSquadEvents');
    if (stored) {
        AppState.events = JSON.parse(stored);
    }
}

function saveUserToStorage() {
    localStorage.setItem('userName', AppState.currentUser.name);
    localStorage.setItem('eventsJoined', JSON.stringify(AppState.currentUser.eventsJoined));
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Lazy load images (if added in future)
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.src = entry.target.dataset.src;
                entry.target.removeAttribute('data-src');
                observer.unobserve(entry.target);
            }
        });
    });
    lazyImages.forEach(img => imageObserver.observe(img));
}

// Service Worker Registration (for offline support in future)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed, app will still work online
    });
}
