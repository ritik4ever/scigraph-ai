import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Science,
  AutoGraph,
  Psychology,
  FileUpload,
  Visibility,
  Share,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalEntities: 0,
    totalRelationships: 0,
    totalHypotheses: 0,
    processingPapers: 0,
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    api.getDashboardData,
    {
      onSuccess: (data) => {
        setStats(data.stats);
      },
    }
  );

  const recentPapers = [
    {
      id: 1,
      title: "CRISPR-Cas9 applications in cancer therapy",
      authors: ["Dr. Smith", "Dr. Johnson"],
      status: "ANALYZED",
      uploadedAt: "2024-03-15",
    },
    {
      id: 2,
      title: "Machine learning in drug discovery",
      authors: ["Dr. Brown", "Dr. Wilson"],
      status: "PROCESSING",
      uploadedAt: "2024-03-14",
    },
    {
      id: 3,
      title: "Novel biomarkers for early detection",
      authors: ["Dr. Davis", "Dr. Miller"],
      status: "ANALYZED",
      uploadedAt: "2024-03-13",
    },
  ];

  const activityData = [
    { name: 'Mon', papers: 4, entities: 120, hypotheses: 8 },
    { name: 'Tue', papers: 6, entities: 180, hypotheses: 12 },
    { name: 'Wed', papers: 8, entities: 240, hypotheses: 16 },
    { name: 'Thu', papers: 5, entities: 150, hypotheses: 10 },
    { name: 'Fri', papers: 9, entities: 290, hypotheses: 18 },
    { name: 'Sat', papers: 7, entities: 210, hypotheses: 14 },
    { name: 'Sun', papers: 3, entities: 90, hypotheses: 6 },
  ];

  const entityDistribution = [
    { name: 'Proteins', value: 145, color: '#00E5FF' },
    { name: 'Genes', value: 98, color: '#7C4DFF' },
    { name: 'Diseases', value: 67, color: '#FF6B35' },
    { name: 'Drugs', value: 89, color: '#4CAF50' },
    { name: 'Pathways', value: 34, color: '#FFD700' },
  ];

  const StatCard = ({ title, value, icon, color, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          border: `1px solid ${color}40`,
          height: '100%',
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" color="white" fontWeight="bold">
                {value.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              {trend && (
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUp sx={{ fontSize: 16, color: '#4CAF50', mr: 0.5 }} />
                  <Typography variant="caption" color="#4CAF50">
                    +{trend}% this week
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <motion.div variants={item}>
          <Box mb={4}>
            <Typography variant="h3" gutterBottom color="white" fontWeight="bold">
              Scientific Discovery Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Accelerating research through AI-powered knowledge graphs
            </Typography>
          </Box>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={item}>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Research Papers"
                value={stats.totalPapers}
                icon={<Science />}
                color="#00E5FF"
                trend={12}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Entities Discovered"
                value={stats.totalEntities}
                icon={<AutoGraph />}
                color="#7C4DFF"
                trend={8}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Relationships"
                value={stats.totalRelationships}
                icon={<TrendingUp />}
                color="#FF6B35"
                trend={15}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Hypotheses Generated"
                value={stats.totalHypotheses}
                icon={<Psychology />}
                color="#4CAF50"
                trend={22}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Processing Queue"
                value={stats.processingPapers}
                icon={<FileUpload />}
                color="#FFD700"
              />
            </Grid>
          </Grid>
        </motion.div>

        <Grid container spacing={3}>
          {/* Activity Chart */}
          <Grid item xs={12} lg={8}>
            <motion.div variants={item}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="white">
                    Research Activity Over Time
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#B0B0B0" />
                        <YAxis stroke="#B0B0B0" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #333',
                            borderRadius: 8,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="papers"
                          stroke="#00E5FF"
                          strokeWidth={3}
                          dot={{ fill: '#00E5FF', strokeWidth: 2, r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="entities"
                          stroke="#7C4DFF"
                          strokeWidth={3}
                          dot={{ fill: '#7C4DFF', strokeWidth: 2, r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="hypotheses"
                          stroke="#4CAF50"
                          strokeWidth={3}
                          dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Entity Distribution */}
          <Grid item xs={12} lg={4}>
            <motion.div variants={item}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="white">
                    Entity Distribution
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={entityDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis
                          dataKey="name"
                          stroke="#B0B0B0"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#B0B0B0" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #333',
                            borderRadius: 8,
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#00E5FF"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Papers */}
          <Grid item xs={12} lg={6}>
            <motion.div variants={item}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="white">
                      Recent Papers
                    </Typography>
                    <Button variant="outlined" size="small">
                      View All
                    </Button>
                  </Box>
                  <Box>
                    {recentPapers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            mb: 2,
                            border: '1px solid #333',
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: '#2A2A2A',
                              cursor: 'pointer',
                            },
                          }}
                        >
                          <Typography variant="subtitle1" color="white" gutterBottom>
                            {paper.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {paper.authors.join(', ')}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={paper.status}
                              size="small"
                              color={paper.status === 'ANALYZED' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                            <Box>
                              <IconButton size="small" color="primary">
                                <Visibility />
                              </IconButton>
                              <IconButton size="small" color="primary">
                                <Share />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} lg={6}>
            <motion.div variants={item}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="white">
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<FileUpload />}
                        sx={{
                          py: 2,
                          background: 'linear-gradient(45deg, #00E5FF 30%, #7C4DFF 90%)',
                        }}
                      >
                        Upload Paper
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AutoGraph />}
                        sx={{ py: 2 }}
                      >
                        View Graph
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Psychology />}
                        sx={{ py: 2 }}
                      >
                        Generate Ideas
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Science />}
                        sx={{ py: 2 }}
                      >
                        Analyze Data
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Processing Status */}
        {stats.processingPapers > 0 && (
          <motion.div variants={item}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" color="white">
                    Processing Status
                  </Typography>
                  <Chip label={`${stats.processingPapers} papers in queue`} color="info" />
                </Box>
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#333',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(45deg, #00E5FF 30%, #7C4DFF 90%)',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  AI analysis in progress...
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default Dashboard;