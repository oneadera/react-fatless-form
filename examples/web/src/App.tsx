import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import SignupForm from './SignupForm'

const theme = createTheme()

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <SignupForm />
      </Container>
    </ThemeProvider>
  )
}
