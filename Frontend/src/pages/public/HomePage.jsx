import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clubService from '../../services/clubService';
import '../../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeClubs: 0,
    events: 0,
    students: 1200
  });
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      // Fetch PUBLIC data only - no auth required
      // Filter: active clubs only, limit to 12 for homepage
      const response = await clubService.listClubs({ 
        limit: 12, 
        status: 'active',
        // Note: No authentication needed for public view
      });
      console.log('Fetched PUBLIC clubs:', response.data);
      setClubs(response.data.clubs || []);
      setStats(prev => ({
        ...prev,
        activeClubs: response.data.total || 0
      }));
    } catch (error) {
      console.error('Error fetching clubs:', error);
      // Gracefully degrade - show nothing if API fails
      // Don't expose internal errors to public
    } finally {
      setLoading(false);
    }
  };

  // Fallback hardcoded clubs in case API fails
  const fallbackClubs = [
    {
      _id: 1,
      name: 'Organising Committee',
      description: 'Coordinates and manages all club activities and events at KMIT',
      logo: '/src/utils/logos/OC-Logo.jpg',
      category: 'Administrative'
    },
    {
      id: 2,
      name: 'Public Relations',
      description: 'Manages communication and public image of KMIT clubs',
      image: '/src/utils/logos/PR-Logo.jpg',
      category: 'Communication'
    },
    {
      id: 3,
      name: 'Aakarshan Art Club',
      description: 'Unleash your creativity through various art forms and exhibitions',
      image: '/src/utils/logos/Aakarshan-logo.jpg',
      category: 'Cultural'
    },
    {
      id: 4,
      name: 'AALP Music Club',
      description: 'Explore the world of music through performances and workshops',
      image: '/src/utils/logos/Aalap-Logo.jpg',
      category: 'Cultural'
    },
    {
      id: 5,
      name: 'Abhinaya Drama Club',
      description: 'Express yourself through theatrical performances and drama',
      image: '/src/utils/logos/AbhinayaLogo.jpg',
      category: 'Cultural'
    },
    {
      id: 6,
      name: 'Riti Fashion Club',
      description: 'Showcase style and creativity through fashion shows and events',
      image: '/src/utils/logos/Riti-Logo.jpg',
      category: 'Cultural'
    },
    {
      id: 7,
      name: 'KMITRA - E-Magazine & Blog',
      description: 'The official magazine and blog platform of KMIT',
      image: '/src/utils/logos/Kmitra-Logo.jpg',
      category: 'Media'
    },
    {
      id: 8,
      name: 'Mudra Dance Club',
      description: 'Express through movement with various dance forms and styles',
      image: '/src/utils/logos/Mudra.jpg',
      category: 'Cultural'
    },
    {
      id: 9,
      name: 'Recurse Coding Club',
      description: 'Enhance your programming skills and participate in hackathons',
      image: '/src/utils/logos/Recurse-Logo.jpg',
      category: 'Technical'
    },
    {
      id: 10,
      name: 'Traces of Lenses Photography Club',
      description: 'Capture moments and learn the art of photography',
      image: '/src/utils/logos/TOL-Logo.png',
      category: 'Creative'
    },
    {
      id: 11,
      name: 'Vachan Speakers Club',
      description: 'Develop public speaking and communication skills',
      image: '/src/utils/logos/Vachan-Logo.jpg',
      category: 'Development'
    },
    {
      id: 12,
      name: 'Kreeda Sports Club',
      description: 'Promote fitness and sportsmanship through various sports activities',
      image: '/src/utils/logos/Kreeda-Logo.jpg',
      category: 'Sports'
    },
    {
      id: 13,
      name: 'Rotaract Club',
      description: 'Engage in community service and leadership development',
      image: '/src/utils/logos/Rotaract.jpg',
      category: 'Social Service'
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      name: 'Patang Utsav on Sankranthi',
      description: 'Celebrate Makar Sankranti with kite flying festival',
      image: '/images/events/patang-utsav.jpg',
      date: 'January 14, 2025'
    },
    {
      id: 2,
      name: 'KMIT Evening',
      description: 'Annual cultural fest showcasing student talent',
      image: '/images/events/kmit-evening.jpg',
      date: 'February 2025'
    }
  ];

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <h1><strong>KMIT Clubs Hub</strong></h1>
            </div>
            <div className="nav-links">
              <a href="#home" className="nav-link">Home</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#clubs" className="nav-link">Clubs</a>
              <a href="#events" className="nav-link">Upcoming Events</a>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/login" className="nav-link">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video */}
      <section id="home" className="hero-video">
        <div className="video-container">
          <video autoPlay loop muted playsInline className="hero-video-bg">
            <source src="/videos/kmit-campus.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-overlay"></div>
        </div>
        <div className="hero-content-wrapper">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Welcome to KMIT Clubs Hub</h1>
              <p className="hero-description">
                Discover, Join, and Engage with Student Clubs at KMIT. Your one-stop platform 
                for club activities, events, and recruitment. Connect with like-minded students 
                and enhance your college experience through diverse cultural, technical, and 
                social activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-number">{stats.activeClubs}</div>
              <div className="stat-label">Active Clubs</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-number">{stats.events}+</div>
              <div className="stat-label">Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-number">{stats.students}+</div>
              <div className="stat-label">Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Clubs Section */}
      <section id="clubs" className="clubs-section">
        <div className="container">
          <h2 className="section-title">Our Clubs</h2>
          <p className="section-subtitle">Explore the diverse range of clubs at KMIT</p>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading clubs...</p>
            </div>
          ) : clubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No clubs available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="clubs-grid-full">
              {clubs.map((club) => (
                <div key={club._id || club.id} className="club-card">
                  <div className="club-image">
                    <img 
                      src={club.logo || club.image} 
                      alt={club.name} 
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23667eea" width="300" height="200"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + club.name.charAt(0) + '%3C/text%3E%3C/svg%3E';
                      }} 
                    />
                    <div className="club-category-badge">{club.category}</div>
                  </div>
                  <div className="club-info">
                    <h3 className="club-name">{club.name}</h3>
                    <p className="club-description">{club.description || 'No description available'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-cta">
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
              Explore Clubs
            </button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title">About Us</h2>
          <div className="about-content">
            <p>
              KMIT Clubs Hub is the central platform for all student club activities at Keshav Memorial Institute of Technology. 
              We bring together 13 diverse clubs spanning cultural, technical, sports, and social service domains. Our mission 
              is to provide students with opportunities to explore their interests, develop new skills, and build lasting 
              connections with peers who share their passions.
            </p>
            <p>
              From organizing spectacular events to fostering creativity and innovation, our clubs play a vital role in 
              enriching campus life. Whether you're interested in art, music, coding, photography, or community service, 
              there's a place for you in our vibrant community.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="events-section">
        <div className="container">
          <h2 className="section-title">Upcoming Events</h2>
          <p className="section-subtitle">Don't miss out on these exciting events</p>
          
          <div className="events-grid-large">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="event-card-large">
                <div className="event-image">
                  <img src={event.image} alt={event.name} onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23764ba2" width="400" height="300"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="32" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + event.name.charAt(0) + '%3C/text%3E%3C/svg%3E';
                  }} />
                </div>
                <div className="event-info">
                  <h3 className="event-name">{event.name}</h3>
                  <p className="event-date">📅 {event.date}</p>
                  <p className="event-description">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="section-cta">
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
              Explore Now
            </button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div>
                  <h4>Address</h4>
                  <p>Keshav Memorial Institute of Technology<br />
                  Narayanguda, Hyderabad - 500029<br />
                  Telangana, India</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div>
                  <h4>Email</h4>
                  <p>clubs@kmit.in<br />info@kmit.in</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div>
                  <h4>Phone</h4>
                  <p>+91 40 2761 0348<br />+91 40 2761 0349</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3><strong>KMIT Clubs Hub</strong></h3>
              <p>Empowering student engagement and club management at Keshav Memorial Institute of Technology</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#clubs">Clubs</a>
              <a href="#events">Events</a>
            </div>
            <div className="footer-section">
              <h4>Get Started</h4>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
              <a href="#contact">Contact Us</a>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="LinkedIn">💼</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 KMIT Clubs Hub. All rights reserved. | Designed with ❤️ for KMIT Students</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
