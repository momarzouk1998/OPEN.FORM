'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/register" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
          &larr; العودة للتسجيل
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">الشروط والأحكام</h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">مقدمة</h2>
            <p>باستخدامك لـ Forms.OpenappO، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يجب عليك التوقف عن استخدام المنصة.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">الحساب</h2>
            <p>عند إنشاء حساب على المنصة، يجب عليك تقديم معلومات دقيقة وكاملة. أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">المحتوى</h2>
            <p>أنت المسؤول الوحيد عن النماذج والبيانات التي تنشئها على المنصة. يحق لنا إزالة أي محتوى ينتهك القوانين أو اللوائح المعمول بها.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">الخصوصية</h2>
            <p>نحن ملتزمون بحماية خصوصيتك. يتم جمع بياناتك واستخدامها وفقاً لسياسة الخصوصية الخاصة بنا.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">الخدمة</h2>
            <p>نحن نبذل قصارى جهدنا لضمان توفر الخدمة بشكل مستمر، ولكن لا نضمن عدم وجود انقطاعات مؤقتة للصيانة أو التحديثات.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">تعديلات</h2>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إعلامك بالتغييرات الجوهرية عبر البريد الإلكتروني.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
