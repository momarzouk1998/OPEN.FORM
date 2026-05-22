"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { ConfettiButton } from "@/components/ConfettiButton";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function TemplatePreviewPage() {
  const params = useParams();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // In a real app, fetch template data based on params.id
  
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel max-w-md w-full p-10 rounded-3xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-4">شكراً لك!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            تم استلام ردك بنجاح. هذا مثال على تجربة المكافأة النفسية (Gamification) بعد تعبئة النموذج، حيث يرى المستخدم قصاصات الورق الملونة 🎉
          </p>
          
          <Link href="/templates" className="text-brand-500 font-bold hover:underline">
            العودة لمكتبة القوالب
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto p-6 md:py-12">
      <Link href="/templates" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-500 mb-8 font-medium transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للقوالب
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 rounded-[2rem]"
      >
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black mb-4">نموذج تجريبي ({params.id})</h1>
          <p className="text-slate-500">هذا تصميم يحاكي (Typeform) بانتقالات سلسة وواجهة حيوية (Glassmorphism).</p>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <label className="block text-lg font-semibold text-slate-800 dark:text-slate-200">
              1. ما هو اسمك الكريم؟
            </label>
            <input 
              type="text" 
              placeholder="اكتب اسمك هنا..." 
              className="glass-input w-full p-4 rounded-xl text-lg"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-slate-800 dark:text-slate-200">
                2. البريد الإلكتروني
              </label>
              <input 
                type="email" 
                placeholder="example@mail.com" 
                className="glass-input w-full p-4 rounded-xl text-lg text-left" dir="ltr"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-slate-800 dark:text-slate-200">
                3. رقم الجوال
              </label>
              <input 
                type="tel" 
                placeholder="05X XXX XXXX" 
                className="glass-input w-full p-4 rounded-xl text-lg text-left" dir="ltr"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <label className="block text-lg font-semibold text-slate-800 dark:text-slate-200">
              4. كيف تقيم تجربتك حتى الآن؟
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['ممتاز', 'جيد جداً', 'مقبول', 'ضعيف'].map((option, i) => (
                <label key={i} className="cursor-pointer">
                  <input type="radio" name="rating" className="peer sr-only" />
                  <div className="glass-input text-center p-4 rounded-xl peer-checked:bg-brand-500 peer-checked:text-white peer-checked:border-brand-500 transition-all font-medium">
                    {option}
                  </div>
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800/50 flex justify-center"
          >
            <ConfettiButton onClick={() => setIsSubmitted(true)}>
              إرسال النموذج والتجربة 🎉
            </ConfettiButton>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
