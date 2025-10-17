Here's a comprehensive NotFoundPage.tsx implementation:

```typescript
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Stack, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import ReplyIcon from '@mui/icons-material/Reply';

const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        textAlign: 'center',
        p: 3
      }}
    >
      <ErrorOutlineIcon 
        sx={{ 
          fontSize: isMobile ? 120 : 200, 
          color: 'error.main', 
          mb: 3 
        }} 
      />
      
      <Typography variant="h3" gutterBottom>
        404 - Page Not Found
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        The page at <strong>{location.pathname}</strong> does not exist.
      </Typography>
      
      <Stack 
        direction={isMobile ? 'column' : 'row'} 
        spacing={2} 
        sx={{ width: '100%', maxWidth: 400 }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
          onClick={handleGoHome}
          fullWidth
        >
          Go Home
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ReplyIcon />}
          onClick={handleGoBack}
          fullWidth
        >
          Go Back
        </Button>
      </Stack>
      
      {/* Optional: Search Suggestions Section */}
      <Box sx={{ mt: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Suggested Pages
        </Typography>
        <Stack spacing={1}>
          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/products')}
          >
            Products
          </Button>
          <Button 
            variant="text" 
            color="primary" 
            onClick={() => navigate('/contact')}
          >
            Contact
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
```

Key Features:
- Uses React with TypeScript
- Leverages Material-UI for responsive design
- Displays current path
- Responsive layout with mobile/desktop variants
- Go Home and Go Back buttons
- Optional search suggestions section
- Error icon and clear messaging
- Uses react-router-dom hooks
- Fully typed component

Note: This assumes you have @mui/material and @mui/icons-material installed. Adjust imports if using a different UI library.
