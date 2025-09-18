import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { searchApi, scrollToElement, getDynamicNulpUrls } from "../../services";
import { menusApi, type HomepageMenuItem } from "../../services";
import styles from "./Header.module.css";

interface NavItem {
  label: string;
  href: string;
  scrollTo?: string; // ID of element to scroll to (for smooth scrolling)
  external?: boolean; // open with window.open
  target?: "_self" | "_blank";
  children?: NavItem[];
}

interface CtaButtonItem {
  label: string;
  href: string;
  external: boolean;
  target: "_self" | "_blank";
}

interface HeaderProps {
  className?: string;
}

const MENU_CACHE_KEY = "nulp_header_menus_v2";
const BUTTON_CACHE_KEY = "nulp_header_button_v2";

const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isContactInView, setIsContactInView] = useState<boolean>(false);
  const [clickedMenu, setClickedMenu] = useState<string>(""); // Track clicked menu for contact us
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  const [isMobile, setIsMobile] = useState(false); // Track if mobile view
  const [isClient, setIsClient] = useState(false); // Track if client-side rendered
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(MENU_CACHE_KEY);
        if (cached) return JSON.parse(cached) as NavItem[];
      } catch {}
    }
    return [];
  });
  const [isMenusLoaded, setIsMenusLoaded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem(MENU_CACHE_KEY);
    }
    return false;
  });
  const [ctaButton, setCtaButton] = useState<CtaButtonItem | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(BUTTON_CACHE_KEY);
        if (cached) return JSON.parse(cached) as CtaButtonItem;
      } catch {}
    }
    return null;
  });
  const [headerLogos, setHeaderLogos] = useState<HomepageMenuItem[]>([]);
  const router = useRouter();

  // Helpers for visibility
  const isWithinPublishWindow = (
    start?: string | null,
    end?: string | null
  ): boolean => {
    const now = new Date();
    const startOk = !start || new Date(start) <= now;
    const endOk = !end || now <= new Date(end);
    return startOk && endOk;
  };

  const isMenuVisible = (m: HomepageMenuItem): boolean => {
    if (!m) return false;
    // Treat missing is_active as true (new API may omit this field)
    const isActive =
      typeof (m as any).is_active === "boolean" ? (m as any).is_active : true;
    if (!isActive) return false;
    if (m.state && m.state.toLowerCase() !== "published") return false;
    if (
      !isWithinPublishWindow(
        m.start_publish_date as any,
        m.end_publish_date as any
      )
    )
      return false;
    return true;
  };

  // Build absolute CMS image URL from relative path
  const buildCmsImageUrl = (path?: string): string => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const { base } = getDynamicNulpUrls();
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const getLogoSrcFromItem = (m: HomepageMenuItem): string => {
    const img: any = (m as any)?.link_image;
    const src =
      img?.formats?.small?.url ||
      img?.formats?.thumbnail?.url ||
      img?.formats?.medium?.url ||
      img?.url ||
      "";
    return buildCmsImageUrl(src);
  };

  // Map Strapi menu to local NavItem
  const mapMenuToNavItem = (m: HomepageMenuItem): NavItem | null => {
    if (!isMenuVisible(m)) return null;

    const label = m.title?.trim() || m.slug;
    const target: "_self" | "_blank" =
      m.target_window === "New_Window" ? "_blank" : "_self";
    const isExternalType = (m.menu_type || "").toLowerCase() === "external";
    const forceExternal = isExternalType || target === "_blank";

    // Classify by actual link target first
    let href = "/";
    let scrollTo: string | undefined = undefined;

    const treatAsInternal = (path: string) =>
      path === "/" || path.startsWith("/about");

    try {
      // Support absolute and relative URLs
      const linkStr = (m.link || "").trim();
      // If relative (starts with / or #), let fallback handle it
      if (linkStr.startsWith("/") || linkStr.startsWith("#")) {
        throw new Error("relative");
      }
      const url = new URL(linkStr);
      const rawPath = url.pathname || "/";
      const path =
        rawPath !== "/" && rawPath.endsWith("/")
          ? rawPath.slice(0, -1)
          : rawPath;
      const hash = url.hash ? url.hash.replace("#", "") : "";

      // If this URL points to one of our app routes
      if (treatAsInternal(path)) {
        const hrefNormalized = path === "" ? "/" : path;
        href = hrefNormalized;
        scrollTo = hash || undefined;
        // Always treat in-app routes as internal for smooth scroll support
        return { label, href, scrollTo, external: false, target };
      }

      // Otherwise, treat as external (respect menu type and target)
      return { label, href: url.toString(), external: true, target };
    } catch (e) {
      // Fallback for relative links like "/about#contact-us" or "#trending-courses"
      const link = (m.link || "").trim();
      const hashIndex = link.indexOf("#");
      const hasHash = hashIndex >= 0;
      const basePath = hasHash ? link.substring(0, hashIndex) : link;
      const hash = hasHash ? link.substring(hashIndex + 1) : "";

      // Treat static HTML files under public (e.g., /sunbird/index.html) as external
      if (basePath.toLowerCase().endsWith(".html")) {
        return { label, href: basePath, external: true, target };
      }

      // Normalize relative path
      const normalizedBase = basePath
        ? basePath.startsWith("/")
          ? basePath
          : `/${basePath}`
        : "/";
      const normalized =
        normalizedBase !== "/" && normalizedBase.endsWith("/")
          ? normalizedBase.slice(0, -1)
          : normalizedBase;

      // If CMS marks as External/New_Window but path is internal, still treat as internal
      const isInternalPath =
        normalized === "/" || normalized.startsWith("/about");
      if (forceExternal && !isInternalPath) {
        const hrefWithHash = hash ? `${normalized}#${hash}` : normalized;
        return { label, href: hrefWithHash, external: true, target };
      }

      if (!basePath || basePath === "/") {
        href = "/";
        scrollTo = hash || undefined;
        return { label, href, scrollTo, external: false, target };
      }
      if (basePath.startsWith("/about")) {
        href = "/about";
        scrollTo = hash || undefined;
        return { label, href, scrollTo, external: false, target };
      }
      if (basePath.startsWith("http")) {
        return { label, href: link, external: true, target };
      }
      href = normalized;
      return { label, href, scrollTo, external: false, target };
    }
  };

  // Fetch menus from Strapi
  useEffect(() => {
    let isMounted = true;
    const loadMenus = async () => {
      const res = await menusApi.getHomepageMenus();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        // Filter only main menus and visible
        const all = res.data.filter((m) => {
          const slug = m?.category?.slug?.toLowerCase?.() || "";
          const name = m?.category?.name?.toLowerCase?.() || "";
          const isMain = slug === "main-menus" || name === "main menus";
          return isMain && isMenuVisible(m);
        });

        // Build parent-child tree
        const byId = new Map<number, HomepageMenuItem>();
        all.forEach((m) => byId.set(m.id, m));
        const childrenMap = new Map<number, HomepageMenuItem[]>();
        all.forEach((m) => {
          const parentId = (m.parent_menu as any)?.id as number | undefined;
          if (parentId && byId.has(parentId)) {
            const arr = childrenMap.get(parentId) || [];
            arr.push(m);
            childrenMap.set(parentId, arr);
          }
        });

        // Top-level only (no parent or parent not in same set)
        const topLevel = all.filter(
          (m) =>
            !(
              (m.parent_menu as any)?.id && byId.has((m.parent_menu as any)?.id)
            )
        );

        // Sort by display_order and map to NavItem with children
        topLevel.sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        const mapped: NavItem[] = topLevel
          .map((parent) => {
            const parentNav = mapMenuToNavItem(parent);
            if (!parentNav) return null;
            const kids = (childrenMap.get(parent.id) || [])
              .filter(isMenuVisible)
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((c) => mapMenuToNavItem(c))
              .filter(Boolean) as NavItem[];
            return { ...parentNav, children: kids };
          })
          .filter(Boolean) as NavItem[];

        // Use only CMS-provided menus
        setNavItems(mapped);
        try {
          sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify(mapped));
        } catch {}

        // Build CTA Button from category 'button'
        const buttonsRaw = res.data.filter((m) => {
          const slug = m?.category?.slug?.toLowerCase?.() || "";
          const name = m?.category?.name?.toLowerCase?.() || "";
          // Support both old and new category names
          const isButton = slug === "header-login" || name === "header login";
          return isButton && isMenuVisible(m);
        });
        buttonsRaw.sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        const btn = buttonsRaw[0];
        if (btn) {
          // Reuse mapping rules for link classification
          const nav = mapMenuToNavItem(btn);
          if (nav) {
            const cta: CtaButtonItem = {
              label: nav.label,
              href: nav.href,
              external: !!nav.external,
              target: nav.target || "_self",
            };
            setCtaButton(cta);
            try {
              sessionStorage.setItem(BUTTON_CACHE_KEY, JSON.stringify(cta));
            } catch {}
          }
        } else {
          setCtaButton(null);
          try {
            sessionStorage.removeItem(BUTTON_CACHE_KEY);
          } catch {}
        }

        // Header Logos from category 'Header Logo'
        const logos = res.data
          .filter((m) => {
            const slug = m?.category?.slug?.toLowerCase?.() || "";
            const name = m?.category?.name?.toLowerCase?.() || "";
            const isLogo = slug === "header-logo" || name === "header logo";
            const hasImage = !!(m as any)?.link_image;
            return isLogo && hasImage && isMenuVisible(m);
          })
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setHeaderLogos(logos);
      }
      setIsMenusLoaded(true);
    };

    // If no cache, delay render until first fetch completes
    if (!isMenusLoaded) {
      loadMenus();
    } else {
      // Refresh in background
      loadMenus();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Function to determine if a nav item is active
  const isNavItemActive = (item: NavItem): boolean => {
    // For About Us page, show only one active at a time
    if (router.pathname === "/about") {
      if (item.scrollTo === "contact-us") {
        const hashActive =
          typeof window !== "undefined" &&
          window.location.hash === "#contact-us";
        return isContactInView || hashActive;
      }
      // Highlight About Us when not in the contact section
      const hashIsContact =
        typeof window !== "undefined" && window.location.hash === "#contact-us";
      return (
        item.href === "/about" &&
        !item.scrollTo &&
        !isContactInView &&
        !hashIsContact
      );
    }

    // For home page - use scroll-based detection
    if (router.pathname === "/") {
      if (item.scrollTo) {
        // Section-based items (Courses, Discussions, State Engagement)
        return activeSection === item.scrollTo;
      } else if (item.href === "/") {
        // Home link is active when at the top or no specific section is active
        return activeSection === "home";
      }
    }

    return false;
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setClickedMenu("");
  }, [router.pathname]);

  // Observe contact section visibility on About page
  useEffect(() => {
    if (router.pathname !== "/about") {
      setIsContactInView(false);
      return;
    }

    const element = document.getElementById("contact-us");
    if (!element) return;

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    } as IntersectionObserverInit;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === element) {
          setIsContactInView(entry.isIntersecting);
        }
      });
    }, observerOptions);

    observer.observe(element);

    const handleScrollTop = () => {
      if (window.scrollY < 100) {
        setIsContactInView(false);
      }
    };

    window.addEventListener("scroll", handleScrollTop);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollTop);
    };
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
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  // Intersection Observer to detect which section is in view (Home page)
  useEffect(() => {
    if (router.pathname !== "/") return; // Only on home page

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Trigger when section is 20% from top
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId || "home");
        }
      });

      // Check if we're at the very top of the page
      if (window.scrollY < 100) {
        setActiveSection("home");
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe sections derived from menus that scroll on home
    const sections = navItems
      .filter((i) => i.href === "/" && i.scrollTo)
      .map((i) => i.scrollTo as string);

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Handle scroll to detect when at top
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection("home");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [router.pathname, navItems]);

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

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
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
        const urls = getDynamicNulpUrls();
        window.location.href = urls.search(query);
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
          behavior: "smooth",
        });

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

    const hrefStr = (item.href || "").toLowerCase();
    const isStaticHtml = hrefStr.endsWith(".html");

    // External link handling (also force .html paths to open directly)
    if (item.external || isStaticHtml) {
      const target = item.target || "_blank";
      if (target === "_blank") {
        window.open(item.href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = item.href;
      }
      return;
    }

    // Generic in-page section navigation based on hash from CMS
    if (item.scrollTo) {
      const targetPage = item.href || "/";
      const isSamePage = router.pathname === targetPage;

      if (isSamePage) {
        // Already on the target page → smooth scroll
        handleSmoothScroll(item.scrollTo);
      } else {
        // Navigate to page first, then precise smooth scroll and set hash
        const onComplete = () => {
          router.events.off("routeChangeComplete", onComplete);
          setTimeout(() => {
            const el = document.getElementById(item.scrollTo!);
            if (el) {
              const rect = el.getBoundingClientRect();
              const top = rect.top + window.pageYOffset - 80;
              window.scrollTo({ top, behavior: "smooth" });
              if (typeof window !== "undefined") {
                // Update hash without scrolling again
                history.replaceState(null, "", `#${item.scrollTo}`);
              }
            }
          }, 100);
        };
        router.events.on("routeChangeComplete", onComplete);
        router.push(targetPage).catch(() => {
          window.location.href = `${targetPage}#${item.scrollTo}`;
        });
      }
      return;
    }

    if (item.scrollTo) {
      if (router.pathname === "/") {
        // If already on home page, just scroll
        handleSmoothScroll(item.scrollTo);
      } else {
        // If on different page, navigate to home then scroll using route event
        const scroll = () => handleSmoothScroll(item.scrollTo!);
        const handler = () => {
          router.events.off("routeChangeComplete", handler);
          scroll();
        };
        router.events.on("routeChangeComplete", handler);
        router.push("/").finally(() => {
          // Safety fallback
          setTimeout(scroll, 200);
        });
      }
    } else {
      // Regular navigation
      if (item.href === "/") {
        setActiveSection("home");
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
            height: isMobile ? "60px" : "70px",
          }}
        />
      )}

      <header
        className={`${styles.header} ${className} ${
          isScrolled ? styles["header--scrolled"] : ""
        }`}
      >
        <div className={styles.header__container}>
          {/* Mobile Logos - Only visible on mobile */}
          <div className={styles["header__mobile-logos"]}>
            {headerLogos.length > 0 ? (
              headerLogos.map((m, idx) => {
                const src = getLogoSrcFromItem(m);
                if (!src) return null;
                const alt =
                  (m as any)?.link_image?.alternativeText || m.title || "Logo";
                const target =
                  m.target_window === "New_Window" ? "_blank" : "_self";
                const href = (m.link || "/").trim();
                return (
                  <a
                    key={`mbl-logo-${m.id}-${idx}`}
                    href={href || "/"}
                    target={target}
                    rel={
                      target === "_blank" ? "noopener noreferrer" : undefined
                    }
                    className={styles["header__mobile-logo-link"]}
                    aria-label={alt}
                  >
                    <Image
                      src={src}
                      alt={alt}
                      width={80}
                      height={32}
                      className={styles["header__mobile-logo"]}
                      priority
                    />
                  </a>
                );
              })
            ) : (
              <>
                <Link href="/" className={styles["header__mobile-logo-link"]}>
                  <Image
                    src={`${
                      getDynamicNulpUrls().base
                    }/images/national_logo.png`}
                    alt="National Logo"
                    width={80}
                    height={32}
                    className={styles["header__mobile-logo"]}
                    priority
                  />
                </Link>
                <Link href="/" className={styles["header__mobile-logo-link"]}>
                  <Image
                    src={`${getDynamicNulpUrls().base}/images/MoHUA_.png`}
                    alt="MoHUA Logo"
                    width={40}
                    height={40}
                    className={styles["header__mobile-logo"]}
                    priority
                  />
                </Link>
              </>
            )}
          </div>

          {/* Brand Logos - Desktop */}
          {isClient && headerLogos.length > 0 && (
            <div className={styles.header__brand}>
              {headerLogos.map((m, idx) => {
                const src = getLogoSrcFromItem(m);
                if (!src) return null;
                const alt =
                  (m as any)?.link_image?.alternativeText || m.title || "Logo";
                const target =
                  m.target_window === "New_Window" ? "_blank" : "_self";
                const href = (m.link || "/").trim();
                return (
                  <a
                    key={`${m.id}-${idx}`}
                    href={href || "/"}
                    target={target}
                    rel={
                      target === "_blank" ? "noopener noreferrer" : undefined
                    }
                    className={styles.header__brandLink}
                    aria-label={alt}
                  >
                    <Image
                      src={src}
                      alt={alt}
                      width={120}
                      height={40}
                      className={styles.header__brandImage}
                    />
                  </a>
                );
              })}
            </div>
          )}

          {/* Desktop Navigation Section */}
          <nav className={styles.header__nav}>
            {/* Navigation Links - Desktop */}
            <ul className={styles["header__nav-list"]} suppressHydrationWarning>
              {isClient &&
                navItems.map((item, index) => (
                  <li key={index} className={styles["header__nav-item"]}>
                    <button
                      type="button"
                      className={`${styles["header__nav-link"]} ${
                        isNavItemActive(item)
                          ? styles["header__nav-link--active"]
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item);
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
            </ul>
          </nav>

          {/* Desktop Actions Section */}
          <div className={styles.header__actions}>
            {/* Search - Desktop */}
            <form
              onSubmit={handleSearchSubmit}
              className={styles.header__search}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Explore Content"
                className={styles["header__search-input"]}
                aria-label="Search content"
              />
              <SearchIcon
                className={styles["header__search-icon"]}
                onClick={handleSearchIconClick}
                style={{ cursor: "pointer" }}
                aria-label="Search"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSearchIconClick();
                  }
                }}
              />
            </form>

            {/* Auth Button - Desktop */}
            {isClient && ctaButton && (
              <button
                type="button"
                className={styles["header__auth-button"]}
                onClick={() => {
                  if (ctaButton.target === "_blank") {
                    window.open(
                      ctaButton.href,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } else {
                    window.location.href = ctaButton.href;
                  }
                }}
              >
                {ctaButton.label}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className={styles["header__mobile-toggle"]}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={styles["header__mobile-menu"]}>
            <div className={styles["header__mobile-content"]}>
              {/* Mobile Navigation */}
              <nav className={styles["header__mobile-nav"]}>
                <ul
                  className={styles["header__mobile-nav-list"]}
                  suppressHydrationWarning
                >
                  {isClient &&
                    navItems.map((item, index) => (
                      <li
                        key={index}
                        className={styles["header__mobile-nav-item"]}
                      >
                        <button
                          type="button"
                          className={`${styles["header__mobile-nav-link"]} ${
                            isNavItemActive(item)
                              ? styles["header__mobile-nav-link--active"]
                              : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(item, true);
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                </ul>
              </nav>

              {/* Mobile Search */}
              <form
                onSubmit={handleSearchSubmit}
                className={styles["header__mobile-search"]}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Explore Content"
                  className={styles["header__mobile-search-input"]}
                  aria-label="Search content"
                />
                <SearchIcon
                  className={styles["header__mobile-search-icon"]}
                  onClick={handleSearchIconClick}
                  style={{ cursor: "pointer" }}
                  aria-label="Search"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSearchIconClick();
                    }
                  }}
                />
              </form>

              {/* Mobile Auth Button */}
              {isClient && ctaButton && (
                <button
                  type="button"
                  className={styles["header__mobile-auth-button"]}
                  onClick={() => {
                    if (ctaButton.target === "_blank") {
                      window.open(
                        ctaButton.href,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    } else {
                      window.location.href = ctaButton.href;
                    }
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {ctaButton.label}
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
