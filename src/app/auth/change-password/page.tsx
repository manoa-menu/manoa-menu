'use client';

import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import swal from 'sweetalert';
import { changePassword } from '@/lib/dbActions';
import LoadingSpinner from '@/components/LoadingSpinner';
import './style.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

type ChangePasswordForm = {
  oldpassword: string;
  password: string;
  confirmPassword: string;
  // acceptTerms: boolean;
};

/** The change password page. */
const ChangePassword = () => {
  const { data: session, status } = useSession();
  const email = session?.user?.email || '';
  const validationSchema = Yup.object().shape({
    oldpassword: Yup.string().required('Password is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(40, 'Password must not exceed 40 characters'),
    confirmPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('password'), ''], 'Confirm Password does not match'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    // console.log(JSON.stringify(data, null, 2));
    await changePassword({ email, ...data });
    await swal('Password Changed', 'Your password has been changed', 'success', { timer: 2000 });
    reset();
  };

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="icon-container">
          <i className="bi bi-key-fill fs-4" />
        </div>

        <h1>Change Password</h1>

        <div>
          <input
            type="password"
            id="oldpassword"
            placeholder="Old Password"
            {...register('oldpassword')}
            className={`input ${errors.oldpassword ? 'input-error' : ''}`}
          />
          {errors.oldpassword && (
            <p>{errors.oldpassword.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            id="password"
            placeholder="New Password"
            {...register('password')}
            className={`input ${errors.password ? 'input-error' : ''}`}
          />
          {errors.password && (
            <p>{errors.password.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Confirm Password"
            {...register('confirmPassword')}
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
          />
          {errors.confirmPassword && (
            <p>{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" className="btn">Change Password</button>
      </form>
    </main>
  );
};

export default ChangePassword;
