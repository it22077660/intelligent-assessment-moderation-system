/**
 * Navigation Bar Component
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/dashboard">
          📚 LOC Analyzer
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard" active={location.pathname === '/dashboard'}>
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/modules" active={location.pathname === '/modules'}>
              Modules
            </Nav.Link>
            <Nav.Link as={Link} to="/questions" active={location.pathname === '/questions'}>
              Questions
            </Nav.Link>
            <Nav.Link as={Link} to="/coverage" active={location.pathname === '/coverage'}>
              Coverage Analysis
            </Nav.Link>
            <Nav.Link as={Link} to="/generator" active={location.pathname === '/generator'}>
              AI Generator
            </Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown title={user?.name || 'User'} id="user-nav-dropdown">
              <NavDropdown.ItemText>
                <small>{user?.email}</small>
                <br />
                <small className="text-muted">Role: {user?.role}</small>
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onLogout}>
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

