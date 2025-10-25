
import Header from '@/components/header';
import { AuthProvider } from '@/components/auth-context';
import PostList from '@/components/post-list';

export default function Page(){
  return (
    <AuthProvider>
      <Header />
      <div className="container">
        <PostList />
      </div>
    </AuthProvider>
  );
}
