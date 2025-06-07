import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Search,
  FilterList,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Download,
  Share,
  Fullscreen,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { useQuery } from 'react-query';
import api from '../../services/api';

const KnowledgeGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [filteredData, setFilteredData] = useState({ nodes: [], links: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [selectedNode, setSelectedNode] = useState(null);
  const [is3D, setIs3D] = useState(true);
  const fgRef = useRef();

  const entityTypes = ['PROTEIN', 'GENE', 'DISEASE', 'DRUG', 'PATHWAY', 'CELL_TYPE'];
  const relationshipTypes = ['INTERACTS_WITH', 'REGULATES', 'INHIBITS', 'ACTIVATES', 'BINDS_TO'];

  // Fetch knowledge graph data
  const { data: kgData, isLoading } = useQuery(
    ['knowledge-graph', { limit: 200 }],
    () => api.getKnowledgeGraph({ limit: 200 }),
    {
      onSuccess: (data) => {
        setGraphData(data);
        setFilteredData(data);
      },
    }
  );

  // Filter graph data based on search and filters
  useEffect(() => {
    let filtered = { ...graphData };

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchingNodes = filtered.nodes.filter(node =>
        node.name.toLowerCase().includes(searchLower)
      );
      const matchingNodeIds = new Set(matchingNodes.map(n => n.id));
      
      filtered.nodes = matchingNodes;
      filtered.links = filtered.links.filter(link =>
        matchingNodeIds.has(link.source) || matchingNodeIds.has(link.target)
      );
    }

    // Entity type filter
    if (selectedEntityTypes.length > 0) {
      filtered.nodes = filtered.nodes.filter(node =>
        selectedEntityTypes.includes(node.type)
      );
      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.links = filtered.links.filter(link =>
        nodeIds.has(link.source) && nodeIds.has(link.target)
      );
    }

    // Confidence threshold filter
    filtered.links = filtered.links.filter(link =>
      link.confidence >= confidenceThreshold
    );
    
    setFilteredData(filtered);
  }, [graphData, searchTerm, selectedEntityTypes, confidenceThreshold]);

  // Node styling based on type
  const getNodeColor = (type) => {
    const colors = {
      PROTEIN: '#00E5FF',
      GENE: '#7C4DFF',
      DISEASE: '#FF6B35',
      DRUG: '#4CAF50',
      PATHWAY: '#FFD700',
      CELL_TYPE: '#FF4081',
      OTHER: '#9E9E9E',
    };
    return colors[type] || colors.OTHER;
  };

  // Custom node rendering
  const nodeThreeObject = (node) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createTextTexture(node.name, getNodeColor(node.type)),
        transparent: true,
      })
    );
    sprite.scale.set(10, 5, 1);
    return sprite;
  };

  // Create text texture for nodes
  const createTextTexture = (text, color) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    // Background
    context.fillStyle = color + '40';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.strokeRect(0, 0, canvas.width, canvas.height);

    // Text
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    return new THREE.CanvasTexture(canvas);
  };

  // Handle node click
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, node.z, 1000);
      fgRef.current.zoom(8, 1000);
    }
  };

  // Handle link hover
  const handleLinkHover = (link) => {
    if (link && fgRef.current) {
      fgRef.current.emitParticle(link);
    }
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const searchResults = await api.searchKnowledgeGraph({
        query: searchTerm,
        entityTypes: selectedEntityTypes,
        maxDistance: 2,
      });
      
      setFilteredData(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Control functions
  const zoomIn = () => fgRef.current?.zoom(1.5, 500);
  const zoomOut = () => fgRef.current?.zoom(0.75, 500);
  const centerGraph = () => fgRef.current?.zoomToFit(1000);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, background: 'rgba(26, 26, 26, 0.9)' }}>
        <Typography variant="h4" gutterBottom color="white" fontWeight="bold">
          Scientific Knowledge Graph
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Explore relationships between scientific entities
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Controls Panel */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', overflow: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="white">
                Graph Controls
              </Typography>

              {/* Search */}
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Search entities"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleSearch} color="primary">
                        <Search />
                      </IconButton>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<Search />}
                >
                  Search Graph
                </Button>
              </Box>

              {/* Entity Type Filter */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Entity Types</InputLabel>
                <Select
                  multiple
                  value={selectedEntityTypes}
                  onChange={(e) => setSelectedEntityTypes(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {entityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Confidence Threshold */}
              <Box mb={3}>
                <Typography gutterBottom color="white">
                  Confidence Threshold: {confidenceThreshold}
                </Typography>
                <Slider
                  value={confidenceThreshold}
                  onChange={(e, value) => setConfidenceThreshold(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Graph Controls */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom color="white">
                  View Controls
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Tooltip title="Zoom In">
                      <IconButton onClick={zoomIn} color="primary">
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4}>
                    <Tooltip title="Zoom Out">
                      <IconButton onClick={zoomOut} color="primary">
                        <ZoomOut />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4}>
                    <Tooltip title="Center Graph">
                      <IconButton onClick={centerGraph} color="primary">
                        <CenterFocusStrong />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>

              {/* Graph Statistics */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom color="white">
                  Graph Statistics
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(0, 229, 255, 0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nodes: {filteredData.nodes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Links: {filteredData.links.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Types: {new Set(filteredData.nodes.map(n => n.type)).size}
                  </Typography>
                </Box>
              </Box>

              {/* Selected Node Info */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Box sx={{ p: 2, bgcolor: 'rgba(124, 77, 255, 0.1)', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="white" gutterBottom>
                        Selected Entity
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {selectedNode.name}
                      </Typography>
                      <Chip
                        label={selectedNode.type}
                        size="small"
                        sx={{ bgcolor: getNodeColor(selectedNode.type) }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Connections: {selectedNode.size || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {(selectedNode.confidence * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Export Options */}
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom color="white">
                  Export Options
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      size="small"
                    >
                      JSON
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Share />}
                      size="small"
                    >
                      Share
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Graph Visualization */}
        <Grid item xs={12} md={9}>
          <Card sx={{ height: '100%', position: 'relative' }}>
            <CardContent sx={{ p: 0, height: '100%' }}>
              {isLoading ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Typography color="text.secondary">Loading knowledge graph...</Typography>
                </Box>
              ) : (
                <ForceGraph3D
                  ref={fgRef}
                  graphData={filteredData}
                  nodeThreeObject={nodeThreeObject}
                  nodeLabel="name"
                  linkColor={() => 'rgba(255, 255, 255, 0.3)'}
                  linkWidth={2}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleWidth={2}
                  linkDirectionalParticleColor={() => '#00E5FF'}
                  onNodeClick={handleNodeClick}
                  onLinkHover={handleLinkHover}
                  backgroundColor="rgba(0, 0, 0, 0)"
                  controlType="orbit"
                  enableNodeDrag={false}
                  d3AlphaDecay={0.01}
                  d3VelocityDecay={0.3}
                  warmupTicks={100}
                  cooldownTicks={200}
                />
              )}

              {/* Floating controls */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Tooltip title="Toggle 3D/2D">
                  <IconButton
                    onClick={() => setIs3D(!is3D)}
                    sx={{
                      bgcolor: 'rgba(26, 26, 26, 0.8)',
                      '&:hover': { bgcolor: 'rgba(26, 26, 26, 0.9)' },
                    }}
                  >
                    <Fullscreen />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Legend */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  bgcolor: 'rgba(26, 26, 26, 0.9)',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #333',
                }}
              >
                <Typography variant="subtitle2" gutterBottom color="white">
                  Entity Types
                </Typography>
                <Grid container spacing={1}>
                  {entityTypes.map((type) => (
                    <Grid item key={type}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: getNodeColor(type),
                            borderRadius: '50%',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {type}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KnowledgeGraph;