// Global variables
let videosData = [];
let currentVideoId = null;

// API Configuration
const API_BASE_URL = 'https://yoruhentai-api.vercel.app/api';

// DOM Elements
const loadingGrid = document.getElementById('loadingGrid');
const videosGrid = document.getElementById('videosGrid');
const errorState = document.getElementById('errorState');

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getVideoIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function updateUrl(videoId) {
    if (videoId) {
        const newUrl = `${window.location.pathname}?id=${videoId}`;
        window.history.pushState({ videoId }, '', newUrl);
    } else {
        window.history.pushState({}, '', window.location.pathname);
    }
}

function goHome() {
    window.location.href = 'index.html';
}

function scrollToVideos() {
    document.getElementById('videos-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// API Functions
async function fetchVideos() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
}

// Video Card Creation
function createVideoCard(video, isRelated = false) {
    const card = document.createElement('div');
    card.className = `video-card${isRelated ? ' related' : ''}`;
    card.onclick = () => navigateToVideo(video.id);
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img 
                src="${video.imageURL}" 
                alt="${video.Nombre}" 
                class="video-image"
                loading="lazy"
                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTcwIDEwMEgxMzAiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHN2Zz4K'"
            >
            <div class="play-overlay">
                <div class="play-button">
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
        </div>
        <div class="video-details">
            <h3 class="video-name" title="${video.Nombre}">${video.Nombre}</h3>
            <p class="video-date">${formatDate(video.createdAt)}</p>
        </div>
    `;
    
    return card;
}

// Navigation
function navigateToVideo(videoId) {
    if (window.location.pathname.includes('video-player.html')) {
        // Already on video player page
        loadVideoPlayer(videoId);
        updateUrl(videoId);
    } else {
        // Navigate to video player page
        window.location.href = `video-player.html?id=${videoId}`;
    }
}

function shareVideo() {
    if (navigator.share && currentVideoId) {
        const video = videosData.find(v => v.id === parseInt(currentVideoId));
        if (video) {
            navigator.share({
                title: video.Nombre,
                text: `Mira este video: ${video.Nombre}`,
                url: window.location.href
            }).catch(console.error);
        }
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Enlace copiado al portapapeles');
        }).catch(() => {
            alert('No se pudo copiar el enlace');
        });
    }
}

// Home Page Functions
async function loadVideos() {
    if (!videosGrid) return;
    
    try {
        // Show loading state
        loadingGrid.style.display = 'grid';
        videosGrid.style.display = 'none';
        errorState.style.display = 'none';
        
        // Fetch videos
        const response = await fetchVideos();
        videosData = response.data || [];
        
        // Hide loading and show videos
        loadingGrid.style.display = 'none';
        
        if (videosData.length > 0) {
            renderVideoGrid(videosData);
            videosGrid.style.display = 'grid';
            
            // Check if there's a video ID in the URL
            const videoId = getVideoIdFromUrl();
            if (videoId) {
                navigateToVideo(parseInt(videoId));
            }
        } else {
            videosGrid.innerHTML = '<div class="error-content"><div class="error-message">No se encontraron videos</div></div>';
            videosGrid.style.display = 'flex';
        }
    } catch (error) {
        console.error('Failed to load videos:', error);
        loadingGrid.style.display = 'none';
        errorState.style.display = 'flex';
    }
}

function renderVideoGrid(videos) {
    if (!videosGrid) return;
    
    videosGrid.innerHTML = '';
    videos.forEach(video => {
        const card = createVideoCard(video);
        videosGrid.appendChild(card);
    });
}

// Video Player Functions
async function loadVideoPlayer(videoId) {
    const playerLoading = document.getElementById('playerLoading');
    const videoContainer = document.getElementById('videoContainer');
    const relatedSection = document.getElementById('relatedSection');
    const playerError = document.getElementById('playerError');
    
    if (!playerLoading || !videoContainer) return;
    
    try {
        currentVideoId = videoId;
        
        // Show loading state
        playerLoading.style.display = 'block';
        videoContainer.style.display = 'none';
        relatedSection.style.display = 'none';
        playerError.style.display = 'none';
        
        // Fetch videos if not already loaded
        if (videosData.length === 0) {
            const response = await fetchVideos();
            videosData = response.data || [];
        }
        
        // Find the current video
        const video = videosData.find(v => v.id === parseInt(videoId));
        
        if (!video) {
            throw new Error('Video not found');
        }
        
        // Update video player
        document.getElementById('videoFrame').src = video.driveURL;
        document.getElementById('currentVideoTitle').textContent = video.Nombre;
        document.getElementById('videoDate').textContent = formatDate(video.createdAt);
        document.getElementById('videoTitle').textContent = `${video.Nombre} - YoruHentai`;
        
        // Show video container
        playerLoading.style.display = 'none';
        videoContainer.style.display = 'block';
        
        // Load related videos
        loadRelatedVideos(parseInt(videoId));
        
    } catch (error) {
        console.error('Failed to load video:', error);
        playerLoading.style.display = 'none';
        playerError.style.display = 'flex';
    }
}

function loadRelatedVideos(currentVideoId) {
    const relatedSection = document.getElementById('relatedSection');
    const relatedGrid = document.getElementById('relatedGrid');
    
    if (!relatedGrid) return;
    
    // Get related videos (exclude current video)
    const relatedVideos = videosData
        .filter(video => video.id !== currentVideoId)
        .slice(0, 4);
    
    if (relatedVideos.length > 0) {
        relatedGrid.innerHTML = '';
        relatedVideos.forEach(video => {
            const card = createVideoCard(video, true);
            relatedGrid.appendChild(card);
        });
        
        relatedSection.style.display = 'block';
    }
}

// Initialize application based on current page
function initializePage() {
    // Check current page
    const isVideoPlayerPage = window.location.pathname.includes('video-player.html');
    
    if (isVideoPlayerPage) {
        // Video player page initialization
        const videoId = getVideoIdFromUrl();
        if (videoId) {
            loadVideoPlayer(videoId);
        } else {
            goHome(); // Redirect to home if no video ID
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.videoId) {
                loadVideoPlayer(event.state.videoId);
            } else {
                goHome();
            }
        });
    } else {
        // Home page initialization
        loadVideos();
        
        // Handle sort change
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const sortBy = e.target.value;
                let sortedVideos = [...videosData];
                
                switch (sortBy) {
                    case 'recent':
                        sortedVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        break;
                    case 'popular':
                        // For demo purposes, just shuffle
                        sortedVideos.sort(() => Math.random() - 0.5);
                        break;
                    case 'rated':
                        // For demo purposes, just reverse
                        sortedVideos.reverse();
                        break;
                }
                
                renderVideoGrid(sortedVideos);
            });
        }
    }
}

// Error handling for images
function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTcwIDEwMEgxMzAiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHN2Zz4K';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
    if (videosData.length === 0) {
        initializePage();
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});
