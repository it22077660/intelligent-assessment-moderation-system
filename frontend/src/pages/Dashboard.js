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
    <Container className="mt-4">
      <Row>
        <Col>
          <h1 className="mb-4">Welcome, {user?.name}!</h1>
          <p className="lead text-muted">
            Learning Outcome Coverage Analyzer - Manage modules, analyze coverage, and generate questions.
          </p>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={4} className="mb-3">
          <Card className="academic-card h-100">
            <Card.Body>
              <Card.Title>📚 Modules</Card.Title>
              <Card.Text>
                {loading ? 'Loading...' : `${stats.totalModules} modules created`}
              </Card.Text>
              <Button as={Link} to="/modules" variant="primary">
                Manage Modules
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="academic-card h-100">
            <Card.Body>
              <Card.Title>❓ Questions</Card.Title>
              <Card.Text>
                Upload or manually add questions to your modules
              </Card.Text>
              <Button as={Link} to="/questions" variant="primary">
                Manage Questions
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="academic-card h-100">
            <Card.Body>
              <Card.Title>📊 Coverage Analysis</Card.Title>
              <Card.Text>
                Analyze learning outcome coverage for your modules
              </Card.Text>
              <Button as={Link} to="/coverage" variant="primary">
                Analyze Coverage
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6} className="mb-3">
          <Card className="academic-card h-100">
            <Card.Body>
              <Card.Title>🤖 AI Question Generator</Card.Title>
              <Card.Text>
                Generate questions automatically based on learning outcomes and Bloom's taxonomy
              </Card.Text>
              <Button as={Link} to="/generator" variant="success">
                Generate Questions
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card className="academic-card h-100">
            <Card.Body>
              <Card.Title>ℹ️ Quick Start Guide</Card.Title>
              <Card.Text>
                <ol className="mb-0">
                  <li>Create a module with learning outcomes</li>
                  <li>Add questions (upload or manual)</li>
                  <li>Run coverage analysis</li>
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

