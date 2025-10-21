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
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isVisible, setIsVisible] = useState({
    stats: false,
    events: false,
    cta: false
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedClubIndex, setSelectedClubIndex] = useState(0);
  const VISIBLE_CARDS = 2; // Show 2 cards at a time

  useEffect(() => {
    fetchClubs();
    
    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.id;
            setIsVisible((prev) => ({ ...prev, [section]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = ['stats', 'events', 'cta'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Navbar scroll detection
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
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
      setClubs(response.data?.data?.clubs || []);
      setStats(prev => ({
        ...prev,
        activeClubs: response.data?.data?.total || 0
      }));
    } catch (error) {
      console.error('Error fetching clubs:', error);
      // Gracefully degrade - show nothing if API fails
      // Don't expose internal errors to public
    } finally {
      setLoading(false);
    }
  };

  // Featured Clubs for Discover Section - ALL 14 KMIT Clubs
  const featuredClubs = [
    {
      id: 'fc-1',
      name: 'Organising Committee',
      shortName: 'OC',
      description: 'The Organising Committee at KMIT is the backbone of all club activities and events. We coordinate seamlessly between different clubs, manage college-wide events, and ensure smooth execution of cultural, technical, and sports activities. From Sankranti celebrations to annual fests, we bring campus life to action.',
      tagline: 'Leading the way in campus excellence',
      backgroundImage: '/src/utils/logos/OC-Logo.jpg',
      cardImage: '/src/utils/logos/OC-Logo.jpg',
      category: 'Administrative'
    },
    {
      id: 'fc-2',
      name: 'Public Relations Club',
      shortName: 'PR CLUB',
      description: 'Public Relations Club manages communication and builds the public image of KMIT clubs. We handle social media presence, event publicity, media relations, and brand building for the college. Join us to master communication strategies, content creation, and digital marketing.',
      tagline: 'Your voice, amplified',
      backgroundImage: '/src/utils/logos/PR-Logo.jpg',
      cardImage: '/src/utils/logos/PR-Logo.jpg',
      category: 'Communication'
    },
    {
      id: 'fc-3',
      name: 'Aakarshan Art Club',
      shortName: 'AAKARSHAN',
      description: 'Aakarshan Art Club is the creative hub of KMIT, bringing together artists and art enthusiasts. We explore diverse art forms including painting, sketching, digital art, and sculpture. Through exhibitions, workshops, and collaborative projects, we nurture artistic talent and celebrate visual creativity.',
      tagline: 'Where imagination meets canvas',
      backgroundImage: '/src/utils/logos/Aakarshan-logo.jpg',
      cardImage: '/src/utils/logos/Aakarshan-logo.jpg',
      category: 'Creative'
    },
    {
      id: 'fc-4',
      name: 'AALP Music Club',
      shortName: 'AALP',
      description: 'AALP Music Club explores the world of music through performances, workshops, and jam sessions. From Indian classical to Western rock, we celebrate all genres. Join us for musical evenings, competitions, and opportunities to perform at college events while honing your musical talents.',
      tagline: 'Harmony in every note',
      backgroundImage: '/src/utils/bg_images/Aalap_music.jpg',
      cardImage: '/src/utils/logos/Aalap-Logo.jpg',
      category: 'Cultural'
    },
    {
      id: 'fc-5',
      name: 'Abhinaya Drama Club',
      shortName: 'ABHINAYA',
      description: 'Abhinaya Drama Club brings theatrical magic to life through powerful performances and storytelling. From street plays to full-scale productions, we explore various forms of drama. Develop acting skills, stage presence, and creative expression while entertaining audiences across campus.',
      tagline: 'Life is a stage, own it',
      backgroundImage: '/src/utils/bg_images/abhinaya_drama2.jpg',
      cardImage: '/src/utils/logos/AbhinayaLogo.jpg',
      category: 'Cultural'
    },
    {
      id: 'fc-6',
      name: 'Riti Fashion Club',
      shortName: 'RITI',
      description: 'Riti Fashion Club showcases style and creativity through fashion shows, styling workshops, and trend analysis. Learn about fashion design, runway modeling, makeup artistry, and event styling. Express your unique style while organizing glamorous fashion events.',
      tagline: 'Style meets substance',
      backgroundImage: '/src/utils/bg_images/riti.jpg',
      cardImage: '/src/utils/logos/Riti-Logo.jpg',
      category: 'Cultural'
    },
    {
      id: 'fc-7',
      name: 'KMITRA E-Magazine',
      shortName: 'KMITRA',
      description: 'KMITRA is the official magazine and blog platform of KMIT, giving voice to student writers, poets, and journalists. We publish articles, stories, interviews, and campus news. Join our editorial team to develop writing skills and share inspiring stories with the KMIT community.',
      tagline: 'Stories that inspire',
      backgroundImage: '/src/utils/bg_images/kmitra.jpg',
      cardImage: '/src/utils/logos/Kmitra-Logo.jpg',
      category: 'Media'
    },
    {
      id: 'fc-8',
      name: 'Mudra Dance Club',
      shortName: 'MUDRA',
      description: 'Mudra Dance Club celebrates the art of movement and expression through various dance forms. From classical Indian dance to contemporary and hip-hop, we provide a platform for dancers of all levels to explore their passion, perform at college events, and participate in inter-college competitions.',
      tagline: 'Rhythm in every step',
      backgroundImage: '/src/utils/bg_images/mudra.jpg',
      cardImage: '/src/utils/logos/Mudra.jpg',
      category: 'Cultural'
    },
    {
      id: 'fc-9',
      name: 'Recurse Coding Club',
      shortName: 'RECURSE',
      description: 'Recurse Coding Club at KMIT is a dynamic community where innovation meets collaboration. We empower students to master competitive programming, participate in hackathons, and build groundbreaking tech projects. From coding marathons to workshops on cutting-edge technologies, we foster a culture of continuous learning and problem-solving.',
      tagline: 'Code. Create. Innovate.',
      backgroundImage: '/src/utils/bg_images/recurse.jpg',
      cardImage: '/src/utils/logos/Recurse-Logo.jpg',
      category: 'Technical'
    },
    {
      id: 'fc-10',
      name: 'Traces of Lenses Photography Club',
      shortName: 'TRACES OF LENSES',
      description: 'Traces of Lenses is dedicated to the art and craft of photography. We help students master camera techniques, composition, and photo editing while documenting campus life and events. Join us for photo walks, exhibitions, and competitions that capture the extraordinary in everyday moments.',
      tagline: 'Freezing moments, creating memories',
      backgroundImage: '/src/utils/bg_images/tol.jpg',
      cardImage: '/src/utils/logos/TOL-Logo.png',
      category: 'Creative'
    },
    {
      id: 'fc-11',
      name: 'Vachan Speakers Club',
      shortName: 'VACHAN',
      description: 'Vachan Speakers Club develops public speaking and communication skills through regular practice sessions, workshops, and competitions. Master the art of effective communication, overcome stage fear, and build confidence to speak with impact in any setting.',
      tagline: 'Speak with confidence, lead with impact',
      backgroundImage: '/src/utils/bg_images/vachan.jpg',
      cardImage: '/src/utils/logos/Vachan-Logo.jpg',
      category: 'Development'
    },
    {
      id: 'fc-12',
      name: 'Kreeda Sports Club',
      shortName: 'KREEDA',
      description: 'Kreeda Sports Club promotes fitness and sportsmanship through various sports activities including cricket, football, basketball, volleyball, and more. Participate in tournaments, fitness sessions, and inter-college competitions while building teamwork and athletic skills.',
      tagline: 'Champions in the making',
      backgroundImage: '/src/utils/logos/Kreeda-Logo.jpg',
      cardImage: '/src/utils/logos/Kreeda-Logo.jpg',
      category: 'Sports'
    },
    {
      id: 'fc-13',
      name: 'Rotaract Club',
      shortName: 'ROTARACT',
      description: 'Rotaract Club engages in community service and leadership development through social initiatives, volunteering, and outreach programs. Make a positive impact on society while developing leadership qualities, empathy, and a sense of responsibility towards the community.',
      tagline: 'Service above self',
      backgroundImage: '/src/utils/logos/Rotaract.jpg',
      cardImage: '/src/utils/logos/Rotaract.jpg',
      category: 'Social Service'
    }
  ];

  // Fallback hardcoded clubs in case API fails
  const fallbackClubs = [
    {
      _id: 1,
      name: 'Organising Committee',
      description: 'Coordinates and manages all club activities and events at KMIT',
      tagline: 'Leading the way in campus excellence',
      logo: '/src/utils/logos/OC-Logo.jpg',
      category: 'Administrative'
    },
    {
      id: 2,
      name: 'Public Relations',
      description: 'Manages communication and public image of KMIT clubs',
      tagline: 'Your voice, amplified',
      image: '/src/utils/logos/PR-Logo.jpg',
      category: 'Communication'
    },
    {
      id: 3,
      name: 'Aakarshan Art Club',
      description: 'Unleash your creativity through various art forms and exhibitions',
      tagline: 'Where imagination meets canvas',
      image: '/src/utils/logos/Aakarshan-logo.jpg',
      category: 'Cultural'
    },
    {
      id: 4,
      name: 'AALP Music Club',
      description: 'Explore the world of music through performances and workshops',
      tagline: 'Harmony in every note',
      image: '/src/utils/logos/Aalap-Logo.jpg',
      category: 'Cultural'
    },
    {
      id: 5,
      name: 'Abhinaya Drama Club',
      description: 'Express yourself through theatrical performances and drama',
      tagline: 'Life is a stage, own it',
      image: '/src/utils/logos/AbhinayaLogo.jpg',
      category: 'Cultural'
    },
    {
      id: 6,
      name: 'Riti Fashion Club',
      description: 'Showcase style and creativity through fashion shows and events',
      tagline: 'Style meets substance',
      image: '/src/utils/logos/Riti-Logo.jpg',
      category: 'Cultural'
    },
    {
      id: 7,
      name: 'KMITRA - E-Magazine & Blog',
      description: 'The official magazine and blog platform of KMIT',
      tagline: 'Stories that inspire',
      image: '/src/utils/logos/Kmitra-Logo.jpg',
      category: 'Media'
    },
    {
      id: 8,
      name: 'Mudra Dance Club',
      description: 'Express through movement with various dance forms and styles',
      tagline: 'Rhythm in every step',
      image: '/src/utils/logos/Mudra.jpg',
      category: 'Cultural'
    },
    {
      id: 9,
      name: 'Recurse Coding Club',
      description: 'Enhance your programming skills and participate in hackathons',
      tagline: 'Where code meets creativity',
      image: '/src/utils/logos/Recurse-Logo.jpg',
      category: 'Technical'
    },
    {
      id: 10,
      name: 'Traces of Lenses Photography Club',
      description: 'Capture moments and learn the art of photography',
      tagline: 'Freezing moments, creating memories',
      image: '/src/utils/logos/TOL-Logo.png',
      category: 'Creative'
    },
    {
      id: 11,
      name: 'Vachan Speakers Club',
      description: 'Develop public speaking and communication skills',
      tagline: 'Speak with confidence, lead with impact',
      image: '/src/utils/logos/Vachan-Logo.jpg',
      category: 'Development'
    },
    {
      id: 12,
      name: 'Kreeda Sports Club',
      description: 'Promote fitness and sportsmanship through various sports activities',
      tagline: 'Champions in the making',
      image: '/src/utils/logos/Kreeda-Logo.jpg',
      category: 'Sports'
    },
    {
      id: 13,
      name: 'Rotaract Club',
      description: 'Engage in community service and leadership development',
      tagline: 'Service above self',
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
      date: '14 January 2025',
      venue: 'OAT & Main Ground'
    },
    {
      id: 2,
      name: 'KMIT Evening',
      description: 'Annual cultural fest showcasing student talent',
      image: '/images/events/kmit-evening.jpg',
      date: 'February 2025',
      venue: 'College Auditorium'
    },
    {
      id: 3,
      name: 'Tech Symposium 2025',
      description: 'Technical event showcasing innovation',
      image: '/images/events/tech-symposium.jpg',
      date: '15 March 2025',
      venue: 'Seminar Hall'
    },
    {
      id: 4,
      name: 'Sports Day',
      description: 'Annual sports competition',
      image: '/images/events/sports-day.jpg',
      date: '20 March 2025',
      venue: 'Sports Complex'
    }
  ];

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
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

      {/* Hero Section with YouTube Video */}
      <section id="home" className="hero-video">
        <div className="video-container">
          <iframe
            className="hero-video-bg"
            src="https://www.youtube.com/embed/gM4bHG7jF0U?autoplay=1&mute=1&loop=1&playlist=gM4bHG7jF0U&controls=0&showinfo=0&rel=0&modestbranding=1"
            title="KMIT Campus Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
        <div className="hero-content-wrapper">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title fade-in">Explore. Connect. Lead.</h1>
              <p className="hero-description fade-in-delay">
                Discover your passion through KMIT's vibrant club ecosystem.
              </p>
              <div className="hero-cta-buttons fade-in-delay-2">
                <button onClick={() => navigate('/clubs')} className="btn btn-primary btn-lg">
                  View Clubs
                </button>
                <button onClick={() => navigate('/register')} className="btn btn-secondary btn-lg">
                  Join a Club
                </button>
                <button onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} className="btn btn-outline btn-lg">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="description-section">
        <div className="container">
          <div className="description-content">
            <h2 className="description-title">About KMIT Clubs</h2>
            <p className="description-text">
              KMIT hosts a vibrant ecosystem of student clubs that span across cultural, technical, sports, and social service domains. 
              Our clubs provide students with platforms to explore their passions, develop leadership skills, and create lasting memories. 
              From organizing spectacular events to nurturing talent, each club plays a vital role in enriching campus life and building 
              a strong, connected community.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section - Redesigned */}
      <section id="stats" className={`stats-section-new ${isVisible.stats ? 'visible' : ''}`}>
        <div className="container">
          <div className="stats-header">
            <h3 className="stats-subtitle">KMIT CLUBS HUB</h3>
            <h2 className="stats-main-title">Stats That Matter.</h2>
          </div>
          <div className="stats-grid-new">
            <div className="stat-item-new">
              <div className="stat-number-new">{stats.activeClubs}</div>
              <div className="stat-label-new">Clubs</div>
            </div>
            <div className="stat-item-new">
              <div className="stat-number-new">{stats.students}+</div>
              <div className="stat-label-new">Members</div>
            </div>
            <div className="stat-item-new">
              <div className="stat-number-new">{stats.events}+</div>
              <div className="stat-label-new">Upcoming Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DISCOVER CLUBS SECTION ==================== */}
      {/* Horizontal 3-card carousel layout */}
      <section id="clubs" className="discover-clubs-section">
        {/* Dynamic Background */}
        <div 
          className="discover-background"
          style={{
            backgroundImage: `url(${featuredClubs[selectedClubIndex].backgroundImage})`
          }}
        >
          <div className="discover-background-overlay"></div>
        </div>

        <div className="discover-container">
          {/* Left Content - Club Info */}
          <div className="discover-content">
            <div className="discover-location-tag">Student Clubs</div>
            <h1 className="discover-title">{featuredClubs[selectedClubIndex].shortName}</h1>
            <p className="discover-description">
              {featuredClubs[selectedClubIndex].description}
            </p>
            <button 
              className="btn-discover-explore"
              onClick={() => navigate('/register')}
            >
              EXPLORE CLUB →
            </button>

            {/* Navigation Arrows - Below Explore Button */}
            <div className="discover-arrows">
              <button 
                className="discover-arrow-btn prev"
                onClick={() => {
                  setSelectedClubIndex(prev => 
                    prev > 0 ? prev - 1 : featuredClubs.length - 1
                  );
                }}
                aria-label="Previous club"
              >
                ‹
              </button>
              <button 
                className="discover-arrow-btn next"
                onClick={() => {
                  setSelectedClubIndex(prev => 
                    prev < featuredClubs.length - 1 ? prev + 1 : 0
                  );
                }}
                aria-label="Next club"
              >
                ›
              </button>
            </div>
          </div>

          {/* Right Content - 2-Card Horizontal Carousel */}
          <div className="discover-cards-carousel">
            <div className="discover-cards-track">
              {featuredClubs.map((club, index) => {
                // Calculate position relative to selected card
                let position = index - selectedClubIndex;
                
                // Show only 2 cards: current and next
                const isVisible = position >= 0 && position < VISIBLE_CARDS;
                
                return (
                  <div
                    key={club.id}
                    className={`discover-carousel-card ${
                      position === 0 ? 'first' : position === 1 ? 'second' : ''
                    } ${isVisible ? 'visible' : 'hidden'}`}
                    onClick={() => setSelectedClubIndex(index)}
                    style={{
                      backgroundImage: `url(${club.cardImage})`,
                      transform: `translateX(${position * 100}%)`,
                      opacity: isVisible ? 1 : 0,
                      pointerEvents: isVisible ? 'auto' : 'none'
                    }}
                  >
                    {/* No overlay or text - images already have club names */}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page Indicator - Bottom Right */}
          <div className="discover-page-indicator">
            <span className="current-page">{selectedClubIndex + 1}</span>
            <span className="page-separator">/</span>
            <span className="total-pages">{featuredClubs.length}</span>
          </div>
        </div>
      </section>
      {/* ==================== END DISCOVER CLUBS SECTION ==================== */}

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

      {/* Upcoming Events - Redesigned */}
      <section id="events" className={`events-section-new ${isVisible.events ? 'visible' : ''}`}>
        <div className="container">
          <h2 className="section-title-new">Upcoming Events</h2>
          
          <div className="events-grid-new">
            {upcomingEvents.map((event, index) => (
              <div key={event.id} className="event-card-new" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="event-card-content">
                  <h3 className="event-title-new">{event.name}</h3>
                  <p className="event-date-new">{event.date}</p>
                  <p className="event-venue-new">{event.venue || 'KMIT Campus'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="section-cta">
            <button onClick={() => navigate('/events')} className="btn btn-primary btn-lg">
              View All Events
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta" className={`cta-section ${isVisible.cta ? 'visible' : ''}`}>
        <div className="cta-overlay"></div>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to lead your club?</h2>
            <p className="cta-subtitle">Start your journey with KMIT Clubs Hub today.</p>
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-xl">
              Get Started
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