import { Provider as PaperProvider } from 'react-native-paper'
import SignupForm from './src/SignupForm'

export default function App() {
  return (
    <PaperProvider>
      <SignupForm />
    </PaperProvider>
  )
}
