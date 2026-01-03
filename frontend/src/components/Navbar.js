/**
 * Navigation Bar Component
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <BootstrapNavbar 
      expand="lg" 
      className="mb-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '1rem 0'
      }}
    >
      <Container>
        <BootstrapNavbar.Brand 
          as={Link} 
          to="/dashboard"
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'white !important',
            textDecoration: 'none'
          }}
        >
          📚 LOC Analyzer
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" style={{ borderColor: 'rgba(255,255,255,0.5)' }} />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              style={{
                color: location.pathname === '/dashboard' ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: location.pathname === '/dashboard' ? '600' : '400',
                margin: '0 0.5rem',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                backgroundColor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/modules"
              style={{
                color: location.pathname === '/modules' ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: location.pathname === '/modules' ? '600' : '400',
                margin: '0 0.5rem',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                backgroundColor: location.pathname === '/modules' ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              Modules
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/questions"
              style={{
                color: location.pathname === '/questions' ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: location.pathname === '/questions' ? '600' : '400',
                margin: '0 0.5rem',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                backgroundColor: location.pathname === '/questions' ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              Questions
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/coverage"
              style={{
                color: location.pathname === '/coverage' ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: location.pathname === '/coverage' ? '600' : '400',
                margin: '0 0.5rem',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                backgroundColor: location.pathname === '/coverage' ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              Coverage Analysis
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/bloom-coverage"
              style={{
                color: location.pathname === '/bloom-coverage' ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: location.pathname === '/bloom-coverage' ? '600' : '400',
                margin: '0 0.5rem',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                backgroundColor: location.pathname === '/bloom-coverage' ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              Bloom's Level Analysis
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/generator"
              style={{
                color: location.pathname === '/generator' ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: location.pathname === '/generator' ? '600' : '400',
                margin: '0 0.5rem',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                backgroundColor: location.pathname === '/generator' ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              AI Generator
            </Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown 
              title={user?.name || 'User'} 
              id="user-nav-dropdown"
              style={{
                color: 'white',
                fontWeight: '500'
              }}
            >
              <NavDropdown.ItemText>
                <small style={{ fontWeight: '600' }}>{user?.email}</small>
                <br />
                <small className="text-muted">Role: {user?.role}</small>
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onLogout} style={{ color: '#dc3545' }}>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;

