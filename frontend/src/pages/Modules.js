/**
 * Modules Page Component
 * Manages module CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap';
import { moduleAPI } from '../utils/api';

function Modules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    moduleCode: '',
    moduleName: '',
    topics: [],
    learningOutcomes: []
  });
  const [currentTopic, setCurrentTopic] = useState({ topicName: '', subtopics: [] });
  const [currentLO, setCurrentLO] = useState({ loId: '', description: '', bloomLevel: 'Remember' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await moduleAPI.getAll();
      setModules(response.data.modules || []);
    } catch (error) {
      setError('Failed to load modules');
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (module = null) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        moduleCode: module.moduleCode,
        moduleName: module.moduleName,
        topics: module.topics || [],
        learningOutcomes: module.learningOutcomes || []
      });
    } else {
      setEditingModule(null);
      setFormData({
        moduleCode: '',
        moduleName: '',
        topics: [],
        learningOutcomes: []
      });
    }
    setCurrentTopic({ topicName: '', subtopics: [] });
    setCurrentLO({ loId: '', description: '', bloomLevel: 'Remember' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingModule(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTopic = () => {
    if (currentTopic.topicName.trim()) {
      setFormData({
        ...formData,
        topics: [...formData.topics, { ...currentTopic, subtopics: currentTopic.subtopics.filter(s => s.trim()) }]
      });
      setCurrentTopic({ topicName: '', subtopics: [] });
    }
  };

  const handleRemoveTopic = (index) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter((_, i) => i !== index)
    });
  };

  const handleAddSubtopic = (topicIndex, subtopic) => {
    if (subtopic.trim()) {
      const updatedTopics = [...formData.topics];
      if (!updatedTopics[topicIndex].subtopics) {
        updatedTopics[topicIndex].subtopics = [];
      }
      updatedTopics[topicIndex].subtopics.push(subtopic.trim());
      setFormData({ ...formData, topics: updatedTopics });
    }
  };

  const handleAddLO = () => {
    if (currentLO.loId.trim() && currentLO.description.trim()) {
      setFormData({
        ...formData,
        learningOutcomes: [...formData.learningOutcomes, { ...currentLO }]
      });
      setCurrentLO({ loId: '', description: '', bloomLevel: 'Remember' });
    }
  };

  const handleRemoveLO = (index) => {
    setFormData({
      ...formData,
      learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingModule) {
        await moduleAPI.update(editingModule._id, formData);
        setSuccess('Module updated successfully');
      } else {
        await moduleAPI.create(formData);
        setSuccess('Module created successfully');
      }
      handleCloseModal();
      loadModules();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await moduleAPI.delete(id);
        setSuccess('Module deleted successfully');
        loadModules();
      } catch (err) {
        setError(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Module Management</h1>
          <p className="text-muted">Create and manage modules with topics and learning outcomes</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleOpenModal()}>
            + Create Module
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : modules.length === 0 ? (
        <Card className="academic-card">
          <Card.Body className="text-center">
            <p className="text-muted">No modules found. Create your first module to get started.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {modules.map((module) => (
            <Col md={6} lg={4} key={module._id} className="mb-3">
              <Card className="academic-card h-100">
                <Card.Body>
                  <Card.Title>{module.moduleCode}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">{module.moduleName}</Card.Subtitle>
                  <Card.Text>
                    <small>
                      <strong>Topics:</strong> {module.topics?.length || 0}<br />
                      <strong>Learning Outcomes:</strong> {module.learningOutcomes?.length || 0}
                    </small>
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleOpenModal(module)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(module._id)}
                  >
                    Delete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingModule ? 'Edit Module' : 'Create New Module'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Module Code *</Form.Label>
              <Form.Control
                type="text"
                name="moduleCode"
                value={formData.moduleCode}
                onChange={handleInputChange}
                required
                placeholder="e.g., CS101"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Module Name *</Form.Label>
              <Form.Control
                type="text"
                name="moduleName"
                value={formData.moduleName}
                onChange={handleInputChange}
                required
                placeholder="e.g., Introduction to Computer Science"
              />
            </Form.Group>

            {/* Topics Section */}
            <Card className="mb-3">
              <Card.Header>
                <strong>Topics</strong>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Topic Name</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      value={currentTopic.topicName}
                      onChange={(e) => setCurrentTopic({ ...currentTopic, topicName: e.target.value })}
                      placeholder="Enter topic name"
                    />
                    <Button type="button" onClick={handleAddTopic}>Add Topic</Button>
                  </div>
                </Form.Group>

                {formData.topics.map((topic, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>{topic.topicName}</strong>
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveTopic(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Add subtopic"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtopic(index, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                    {topic.subtopics && topic.subtopics.length > 0 && (
                      <ul className="mt-2 mb-0">
                        {topic.subtopics.map((subtopic, subIndex) => (
                          <li key={subIndex}><small>{subtopic}</small></li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Learning Outcomes Section */}
            <Card className="mb-3">
              <Card.Header>
                <strong>Learning Outcomes</strong>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>LO ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={currentLO.loId}
                        onChange={(e) => setCurrentLO({ ...currentLO, loId: e.target.value })}
                        placeholder="e.g., LO1"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bloom's Level</Form.Label>
                      <Form.Select
                        value={currentLO.bloomLevel}
                        onChange={(e) => setCurrentLO({ ...currentLO, bloomLevel: e.target.value })}
                      >
                        {bloomLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        value={currentLO.description}
                        onChange={(e) => setCurrentLO({ ...currentLO, description: e.target.value })}
                        placeholder="Learning outcome description"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button type="button" onClick={handleAddLO} className="mb-3">Add Learning Outcome</Button>

                {formData.learningOutcomes.map((lo, index) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{lo.loId}</strong> - {lo.description}
                        <Badge bg="info" className="ms-2">{lo.bloomLevel}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveLO(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit">
              {editingModule ? 'Update' : 'Create'} Module
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Modules;

