import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { searchApi, scrollToElement } from '../../services';
import styles from './Header.module.css';

interface NavItem {
  label: string;
  href: string;
  scrollTo?: string; // ID of element to scroll to (for smooth scrolling)
}

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('home'); // Track active section
  const [clickedMenu, setClickedMenu] = useState<string>(''); // Track clicked menu for contact us
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  const [isMobile, setIsMobile] = useState(false); // Track if mobile view
  const [isClient, setIsClient] = useState(false); // Track if client-side rendered
  const router = useRouter();

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/', scrollTo: 'trending-courses' },
    { label: 'Discussions', href: '/', scrollTo: 'trending-discussions' },
    { label: 'State Engagement', href: '/', scrollTo: 'state-engagement' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: 'mailto:nulp@niua.org' },
  ];

  // Function to determine if a nav item is active
  const isNavItemActive = (item: NavItem): boolean => {
    // Handle Contact Us - active when clicked
    if (item.href === 'mailto:nulp@niua.org') {
      return clickedMenu === 'Contact Us';
    }
    
    // For About Us page
    if (router.pathname === '/about') {
      return item.href === '/about';
    }
    
    // For home page - use scroll-based detection
    if (router.pathname === '/') {
      if (item.scrollTo) {
        // Section-based items (Courses, Discussions, State Engagement)
        return activeSection === item.scrollTo;
      } else if (item.href === '/') {
        // Home link is active when at the top or no specific section is active
        return activeSection === 'home';
      }
    }
    
    return false;
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setClickedMenu('');
  }, [router.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest(`.${styles.header}`)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Intersection Observer to detect which section is in view
  useEffect(() => {
    if (router.pathname !== '/') return; // Only on home page

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is 20% from top
      threshold: 0.1
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId || 'home');
        }
      });

      // Check if we're at the very top of the page
      if (window.scrollY < 100) {
        setActiveSection('home');
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sections = [
      'trending-courses',
      'trending-discussions', 
      'state-engagement'
    ];

    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Handle scroll to detect when at top
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [router.pathname]);

  useEffect(() => {
    setIsClient(true); // Mark as client-side rendered
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50); // Lower threshold for better sticky behavior
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    handleResize();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Centralized search handler
  const performSearch = async (query: string) => {
    if (query.trim()) {
      try {
        // Use the centralized API service for search - same tab
        await searchApi.redirectToSearchSameTab(query);
      } catch (error) {
        // Fallback: Direct redirect in same tab if API service fails
        window.location.href = `https://nulp.niua.org/webapp?query=${encodeURIComponent(query)}`;
      }
    }
  };

  // Handle form submission (Enter key)
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await performSearch(searchQuery);
  };

  // Handle search icon click
  const handleSearchIconClick = async () => {
    await performSearch(searchQuery);
  };

  // Handle input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle smooth scroll to section - Optimized for immediate response
  const handleSmoothScroll = (elementId: string) => {
    const scrollToTarget = () => {
      const element = document.getElementById(elementId);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const targetPosition = elementRect.top + window.pageYOffset - 80;
        
        // Use native smooth scroll for immediate response
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Immediately set active section for better UX
        setActiveSection(elementId);
        return true;
      }
      return false;
    };

    // Try immediate scroll
    if (!scrollToTarget()) {
      // If element not found, retry after a short delay (DOM might still be rendering)
      setTimeout(() => {
        scrollToTarget();
      }, 50);
    }
  };

  // Handle navigation click
  const handleNavClick = (item: NavItem, closeMobileMenu: boolean = false) => {
    if (closeMobileMenu) {
      setIsMobileMenuOpen(false);
    }

    if (item.href === 'mailto:nulp@niua.org') {
      // Handle Contact Us - set as clicked and open mailto
      setClickedMenu('Contact Us');
      window.location.href = item.href;
      
      // Reset after a short delay
      setTimeout(() => setClickedMenu(''), 2000);
      return;
    }

    if (item.scrollTo) {
      // If it's a scroll-to item, set it as active immediately
      setActiveSection(item.scrollTo);
      
      if (router.pathname === '/') {
        // If already on home page, just scroll
        handleSmoothScroll(item.scrollTo);
      } else {
        // If on different page, navigate to home then scroll
        router.push('/').then(() => {
          // Wait for navigation to complete, then scroll
          setTimeout(() => {
            handleSmoothScroll(item.scrollTo!);
          }, 100);
        });
      }
    } else {
      // Regular navigation
      if (item.href === '/') {
        setActiveSection('home');
      }
      router.push(item.href);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Header Spacer - Prevents layout shift when header becomes fixed */}
      {isClient && isScrolled && (
        <div 
          style={{ 
            height: isMobile ? '60px' : '70px' 
          }} 
        />
      )}
      
      <header className={`${styles.header} ${className} ${isScrolled ? styles['header--scrolled'] : ''}`}>
        <div className={styles.header__container}>
          {/* Mobile Logos - Only visible on mobile */}
          <div className={styles['header__mobile-logos']}>
            <Link href="/" className={styles['header__mobile-logo-link']}>
              <Image
                src="https://nulp.niua.org/images/national_logo.png"
                alt="National Logo"
                width={200}
                height={200}
                className={styles['header__mobile-logo']}
                priority
              />
            </Link>
            <Link href="/" className={styles['header__mobile-logo-link']}>
              <Image
                src="https://nulp.niua.org/images/MoHUA_.png"
                alt="MoHUA Logo"
                width={50}
                height={50}
                className={styles['header__mobile-logo']}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation Section */}
          <nav className={styles.header__nav}>
            {/* Navigation Links - Desktop */}
            <ul className={styles['header__nav-list']}>
              {navItems.map((item, index) => (
                <li key={index} className={styles['header__nav-item']}>
                  {item.href === 'mailto:nulp@niua.org' ? (
                    // Handle mailto links as regular links
                    <Link
                      href={item.href}
                      className={`${styles['header__nav-link']} ${
                        isNavItemActive(item) ? styles['header__nav-link--active'] : ''
                      }`}
                      onClick={() => {
                        setClickedMenu('Contact Us');
                        setTimeout(() => setClickedMenu(''), 2000);
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    // Use button for all internal navigation (including scroll-to items)
                    <button
                      type="button"
                      className={`${styles['header__nav-link']} ${
                        isNavItemActive(item) ? styles['header__nav-link--active'] : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item);
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Actions Section */}
          <div className={styles.header__actions}>
            {/* Search - Desktop */}
            <form onSubmit={handleSearchSubmit} className={styles.header__search}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Explore Content"
                className={styles['header__search-input']}
                aria-label="Search content"
              />
              <SearchIcon 
                className={styles['header__search-icon']} 
                onClick={handleSearchIconClick}
                style={{ cursor: 'pointer' }}
                aria-label="Search"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSearchIconClick();
                  }
                }}
              />
            </form>

            {/* Auth Button - Desktop */}
            <button
              type="button"
              className={styles['header__auth-button']}
              onClick={() => {
                window.location.href = 'https://nulp.niua.org/webapp/domainList';
              }}
            >
              Log In/Sign Up
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className={styles['header__mobile-toggle']}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={styles['header__mobile-menu']}>
            <div className={styles['header__mobile-content']}>
              {/* Mobile Navigation */}
              <nav className={styles['header__mobile-nav']}>
                <ul className={styles['header__mobile-nav-list']}>
                  {navItems.map((item, index) => (
                    <li key={index} className={styles['header__mobile-nav-item']}>
                      {item.href === 'mailto:nulp@niua.org' ? (
                        <Link
                          href={item.href}
                          className={`${styles['header__mobile-nav-link']} ${
                            isNavItemActive(item) ? styles['header__mobile-nav-link--active'] : ''
                          }`}
                          onClick={() => {
                            setClickedMenu('Contact Us');
                            setTimeout(() => setClickedMenu(''), 2000);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`${styles['header__mobile-nav-link']} ${
                            isNavItemActive(item) ? styles['header__mobile-nav-link--active'] : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(item, true);
                          }}
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className={styles['header__mobile-search']}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Explore Content"
                  className={styles['header__mobile-search-input']}
                  aria-label="Search content"
                />
                <SearchIcon 
                  className={styles['header__mobile-search-icon']} 
                  onClick={handleSearchIconClick}
                  style={{ cursor: 'pointer' }}
                  aria-label="Search"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSearchIconClick();
                    }
                  }}
                />
              </form>

              {/* Mobile Auth Button */}
              <button
                type="button"
                className={styles['header__mobile-auth-button']}
                onClick={() => {
                  window.location.href = 'https://nulp.niua.org/webapp/domainList';
                  setIsMobileMenuOpen(false);
                }}
              >
                Log In/Sign Up
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header; 