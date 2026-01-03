/**
 * Dashboard Page Component
 * Main landing page after login
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { moduleAPI, coverageAPI } from '../utils/api';

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalModules: 0,
    totalQuestions: 0,
    analyzedModules: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const modulesResponse = await moduleAPI.getAll();
      const modules = modulesResponse.data.modules || [];
      
      setStats({
        totalModules: modules.length,
        totalQuestions: 0, // Would need to fetch all questions
        analyzedModules: 0 // Would need to check coverage reports
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4 fade-in">
      <div className="page-header">
        <h1 className="mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="lead text-muted mb-0">
          Learning Outcome Coverage Analyzer - Manage modules, analyze coverage, and generate questions.
        </p>
      </div>

      <Row className="mt-4">
        <Col md={4} className="mb-4">
          <Card className="academic-card h-100" style={{ borderLeft: '4px solid #667eea' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <Card.Title style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Modules
                </Card.Title>
                <Card.Text style={{ fontSize: '1.1rem', color: '#6c757d' }}>
                  {loading ? 'Loading...' : `${stats.totalModules} modules created`}
                </Card.Text>
              </div>
              <Button 
                as={Link} 
                to="/modules" 
                variant="primary"
                className="mt-auto"
                style={{ width: '100%' }}
              >
                Manage Modules →
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="academic-card h-100" style={{ borderLeft: '4px solid #17a2b8' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
                <Card.Title style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Questions
                </Card.Title>
                <Card.Text style={{ fontSize: '1.1rem', color: '#6c757d' }}>
                  Upload or manually add questions to your modules
                </Card.Text>
              </div>
              <Button 
                as={Link} 
                to="/questions" 
                variant="primary"
                className="mt-auto"
                style={{ width: '100%' }}
              >
                Manage Questions →
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="academic-card h-100" style={{ borderLeft: '4px solid #28a745' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <Card.Title style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Coverage Analysis
                </Card.Title>
                <Card.Text style={{ fontSize: '1.1rem', color: '#6c757d' }}>
                  Analyze learning outcome coverage for your modules
                </Card.Text>
              </div>
              <Button 
                as={Link} 
                to="/coverage" 
                variant="primary"
                className="mt-auto"
                style={{ width: '100%' }}
              >
                Analyze Coverage →
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6} className="mb-4">
          <Card className="academic-card h-100" style={{ borderLeft: '4px solid #ffc107' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <Card.Title style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                  AI Question Generator
                </Card.Title>
                <Card.Text style={{ fontSize: '1.1rem', color: '#6c757d' }}>
                  Generate questions automatically based on learning outcomes and Bloom's taxonomy
                </Card.Text>
              </div>
              <Button 
                as={Link} 
                to="/generator" 
                variant="success"
                className="mt-auto"
                style={{ width: '100%' }}
              >
                Generate Questions →
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="academic-card h-100" style={{ borderLeft: '4px solid #764ba2' }}>
            <Card.Body>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ℹ️</div>
              <Card.Title style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                Quick Start Guide
              </Card.Title>
              <Card.Text>
                <ol className="mb-0" style={{ paddingLeft: '1.5rem', fontSize: '1rem', lineHeight: '2' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Create a module with learning outcomes</li>
                  <li style={{ marginBottom: '0.5rem' }}>Add questions (upload or manual)</li>
                  <li style={{ marginBottom: '0.5rem' }}>Run coverage analysis</li>
                  <li>Generate questions for uncovered LOs</li>
                </ol>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;

