import * as yup from 'yup'
import { Stack, Typography, Button, Alert } from '@mui/material'
import { useForm, FormProvider, useFormContext, useFormSubmit, yupResolver } from 'react-fatless-form-web'
import ControlledTextField from './fields/ControlledTextField'
import ControlledCheckbox from './fields/ControlledCheckbox'

export interface SignupValues {
  firstName: string
  lastName: string
  email: string
  password: string
  agreeToTerms: boolean
}

const initialValues: SignupValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  agreeToTerms: false,
}

const schema = yup.object<SignupValues>({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email address').required('Email is required'),
  password: yup.string().min(8, 'Must be at least 8 characters').required('Password is required'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms to continue')
    .required(),
})

// Pretend API call - swap for the real thing.
async function signUp(values: SignupValues): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  console.log('signed up:', values)
}

export default function SignupForm() {
  const form = useForm<SignupValues>(initialValues)

  return (
    <FormProvider form={form}>
      <SignupFormFields />
    </FormProvider>
  )
}

function SignupFormFields() {
  const form = useFormContext<SignupValues>()

  const onSubmit = useFormSubmit<SignupValues>(yupResolver(schema), signUp, {
    onSuccess: () => {
      form.resetForm()
    },
  })

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2} sx={{ maxWidth: 400 }}>
      <Typography variant="h5">Create your account</Typography>

      <ControlledTextField<SignupValues> name="firstName" label="First name" autoFocus />
      <ControlledTextField<SignupValues> name="lastName" label="Last name" />
      <ControlledTextField<SignupValues> name="email" label="Email" type="email" />
      <ControlledTextField<SignupValues> name="password" label="Password" type="password" />
      <ControlledCheckbox<SignupValues> name="agreeToTerms" label="I agree to the terms of service" />

      {form.submissionStatus === 'success' && (
        <Alert severity="success">Account created - check your inbox to verify your email.</Alert>
      )}
      {form.submissionStatus === 'error' && (
        <Alert severity="error">Something went wrong. Please try again.</Alert>
      )}

      <Button type="submit" variant="contained" loading={form.submissionStatus === 'submitting'}>
        Sign up
      </Button>
    </Stack>
  )
}
