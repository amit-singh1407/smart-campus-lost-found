import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../services/api'

const schema = z.object({
  email: z.string().email('Enter a valid college email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values) => {
    try {
      const response = await api.auth.login(values)
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('current_user', JSON.stringify(response.data.user))
      toast.success(response.message || 'Login successful.')
    } catch (error) {
      toast.error(error.message || 'Login failed.')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow accent">Welcome back</p>
        <h2>Login to your portal</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <label>
            <span>College email</span>
            <input type="email" {...register('email')} placeholder="name@campus.edu" />
            {errors.email && <small>{errors.email.message}</small>}
          </label>

          <label>
            <span>Password</span>
            <input type="password" {...register('password')} placeholder="Enter your password" />
            {errors.password && <small>{errors.password.message}</small>}
          </label>

          <button type="submit" className="primary-btn full-width" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
