import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Visibility,
  Download,
  Share,
  Delete,
  Refresh,
  Analytics,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PaperAnalyzer = () => {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch papers
  const { data: papersData, isLoading } = useQuery(
    ['papers', { page: 1, limit: 20 }],
    () => api.getPapers({ page: 1, limit: 20 })
  );

  // Upload mutation
  const uploadMutation = useMutation(api.uploadPaper, {
    onSuccess: () => {
      queryClient.invalidateQueries('papers');
      toast.success('Paper uploaded successfully!');
    },
    onError: (error) => {
      toast.error('Failed to upload paper');
      console.error('Upload error:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation(api.deletePaper, {
    onSuccess: () => {
      queryClient.invalidateQueries('papers');
      toast.success('Paper deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete paper');
    },
  });

  // Re-analyze mutation
  const analyzeMutation = useMutation(api.analyzePaper, {
    onSuccess: () => {
      queryClient.invalidateQueries('papers');
      toast.success('Analysis started!');
    },
    onError: () => {
      toast.error('Failed to start analysis');
    },
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const formData = new FormData();
      formData.append('paper', file);
      uploadMutation.mutate(formData);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ANALYZED':
        return 'success';
      case 'PROCESSING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ANALYZED':
        return 'Complete';
      case 'PROCESSING':
        return 'Processing';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Uploaded';
    }
  };

  const handleViewPaper = async (paperId) => {
    try {
      const paper = await api.getPaper(paperId);
      setSelectedPaper(paper);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load paper details');
    }
  };

  const papers = papersData?.papers || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" gutterBottom color="white" fontWeight="bold">
          Paper Analyzer
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Upload and analyze scientific papers with AI-powered insights
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="white">
                  Upload New Paper
                </Typography>
                
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : '#333',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0, 229, 255, 0.05)',
                    },
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom color="white">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a paper'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    or click to select files
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supports PDF, TXT, JSON files (max 10MB)
                  </Typography>
                </Box>

                {uploadMutation.isLoading && (
                  <Box mt={2}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Uploading and processing...
                    </Typography>
                  </Box>
                )}

                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom color="white">
                    Analysis Features
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {[
                      'Entity extraction',
                      'Relationship mapping',
                      'Key findings summary',
                      'Hypothesis generation',
                      'Similar paper detection',
                    ].map((feature, index) => (
                      <Box key={feature} display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Papers List */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" color="white">
                    Uploaded Papers ({papers.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => queryClient.invalidateQueries('papers')}
                  >
                    Refresh
                  </Button>
                </Box>

                {isLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'text.secondary' }}>Title</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>Authors</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>Status</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>Uploaded</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {papers.map((paper, index) => (
                            <motion.tr
                              key={paper._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <TableCell sx={{ color: 'white' }}>
                                <Typography variant="subtitle2" noWrap>
                                  {paper.title}
                                </Typography>
                                {paper.categories.length > 0 && (
                                  <Box mt={1}>
                                    {paper.categories.slice(0, 2).map((category) => (
                                      <Chip
                                        key={category}
                                        label={category}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mr: 0.5, fontSize: '0.7rem' }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell sx={{ color: 'text.secondary' }}>
                                {paper.authors.length > 0 ? (
                                  <Typography variant="body2" noWrap>
                                    {paper.authors.slice(0, 2).map(a => a.name).join(', ')}
                                    {paper.authors.length > 2 && ' et al.'}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.disabled">
                                    Unknown
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={getStatusText(paper.processingStatus)}
                                  color={getStatusColor(paper.processingStatus)}
                                  size="small"
                                />
                                {paper.processingStatus === 'PROCESSING' && (
                                  <LinearProgress sx={{ mt: 1, width: 80 }} />
                                )}
                              </TableCell>
                              <TableCell sx={{ color: 'text.secondary' }}>
                                <Typography variant="body2">
                                  {new Date(paper.createdAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={0.5}>
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewPaper(paper._id)}
                                      color="primary"
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Re-analyze">
                                    <IconButton
                                      size="small"
                                      onClick={() => analyzeMutation.mutate(paper._id)}
                                      color="secondary"
                                      disabled={paper.processingStatus === 'PROCESSING'}
                                    >
                                      <Analytics />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download">
                                    <IconButton size="small" color="success">
                                      <Download />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Share">
                                    <IconButton size="small" color="info">
                                      <Share />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => deleteMutation.mutate(paper._id)}
                                      color="error"
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {papers.length === 0 && !isLoading && (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={4}
                  >
                    <CloudUpload sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No papers uploaded yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Upload your first scientific paper to get started
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Paper Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="white">
            Paper Analysis Results
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPaper && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom color="primary">
                  {selectedPaper.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedPaper.abstract}
                </Typography>
              </Grid>

              {selectedPaper.extractedEntities && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="white">
                    Extracted Entities ({selectedPaper.extractedEntities.length})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedPaper.extractedEntities.slice(0, 20).map((entity, index) => (
                      <Chip
                        key={index}
                        label={`${entity.text} (${entity.type})`}
                        size="small"
                        variant="outlined"
                        sx={{ color: getNodeColor(entity.type) }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {selectedPaper.analysisResults && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="white">
                    Analysis Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedPaper.analysisResults.summary}
                  </Typography>
                  
                  {selectedPaper.analysisResults.keyFindings && (
                    <>
                      <Typography variant="subtitle2" gutterBottom color="white">
                        Key Findings:
                      </Typography>
                      <Box component="ul" sx={{ color: 'text.secondary', pl: 2 }}>
                        {selectedPaper.analysisResults.keyFindings.map((finding, index) => (
                          <li key={index}>
                            <Typography variant="body2">{finding}</Typography>
                          </li>
                        ))}
                      </Box>
                    </>
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Analysis
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaperAnalyzer;