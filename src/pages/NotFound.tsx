import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-agri-pattern opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl"
        >
          <Search className="w-16 h-16 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-8xl font-bold gradient-text mb-4"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          页面未找到
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-600 mb-8"
        >
          抱歉，您访问的页面不存在或已被移除。请检查网址是否正确，或返回首页继续浏览。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上一页
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            返回首页
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 bg-white/60 backdrop-blur rounded-2xl border border-green-100"
        >
          <h3 className="font-semibold text-gray-900 mb-3">快速导航</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <button
              onClick={() => navigate('/consumer/trace')}
              className="p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
            >
              追溯查询
            </button>
            <button
              onClick={() => navigate('/consumer/complaint')}
              className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
            >
              在线投诉
            </button>
            <button
              onClick={() => navigate('/login')}
              className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
            >
              用户登录
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
