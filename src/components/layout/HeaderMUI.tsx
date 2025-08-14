// src/components/layout/HeaderMUI.tsx

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import { HiMenu, HiX } from 'react-icons/hi';
import { NAV_ITEMS } from '@/data/portfolioData';
import { NavItem } from '@/types';
import LanguageToggle from '@/components/ui/LanguageToggle';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const HeaderMUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDrawer = (open: boolean) => () => {
    setIsOpen(open);
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    // Smooth scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: isScrolled 
            ? 'rgba(15, 23, 42, 0.9)' 
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          boxShadow: isScrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
          transition: 'all 0.3s ease',
          py: isScrolled ? 0.5 : 1,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Logo/Title */}
            <Typography
              variant="h6"
              component="a"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: 'none',
                fontSize: { xs: '1.125rem', sm: '1.25rem', lg: '1.5rem' },
                transition: 'color 0.3s',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {t.header.welcome}
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                {t.header.portfolio}
              </Box>
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1 }}>
              {NAV_ITEMS.map((item: NavItem) => (
                <Button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  sx={{
                    color: 'text.secondary',
                    px: { lg: 1.5, xl: 2 },
                    fontSize: { lg: '0.875rem', xl: '1rem' },
                    fontWeight: 500,
                    '&:hover': {
                      color: 'text.primary',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {t.nav[item.key as keyof typeof t.nav]}
                </Button>
              ))}
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThemeToggle />
                <LanguageToggle />
              </Box>
            </Box>

            {/* Mobile Menu Button */}
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ 
                display: { lg: 'none' },
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                }
              }}
            >
              <HiMenu />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={toggleDrawer(false)}
        sx={{
          display: { lg: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 320 },
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {t.header.menu || 'Menu'}
          </Typography>
          <IconButton onClick={toggleDrawer(false)} sx={{ color: 'text.secondary' }}>
            <HiX />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <List sx={{ px: 2, py: 3 }}>
          {NAV_ITEMS.map((item: NavItem) => (
            <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.href)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    '& .MuiListItemText-primary': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemText 
                  primary={t.nav[item.key as keyof typeof t.nav]}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <ThemeToggle />
          <LanguageToggle />
        </Box>
      </Drawer>
    </>
  );
};

export default HeaderMUI;