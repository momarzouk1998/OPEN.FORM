import re

file_path = r"d:\Open App.Form\src\app\forms\[id]\edit\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove left panel
left_panel_start = content.find("{/* ======================== LEFT PANEL - Question Editor ======================== */}")
left_panel_end = content.find("{/* ======================== CENTER PANEL - Form Info + Question Types ======================== */}")
if left_panel_start != -1 and left_panel_end != -1:
    left_panel_content = content[left_panel_start:left_panel_end]
    content = content[:left_panel_start] + content[left_panel_end:]

# 2. Extract the settings part from the original left panel to inject it into the question card
settings_start = left_panel_content.find("<!-- START SETTINGS -->") # not there, let's just use regex or extract manually
# Actually, I can just use a predefined settings block string because I know what it contains.

settings_jsx = """
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                                  {/* Question Text */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">نص السؤال</label>
                                    <input type="text" value={question.text} onChange={(e) => updateQuestion(qIndex, { text: e.target.value })} placeholder="اكتب السؤال هنا..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                  </div>

                                  {/* Required & Points */}
                                  <div className="flex gap-4">
                                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer flex-1">
                                      <input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                                      <span className="text-sm text-gray-700 font-medium">مطلوب</span>
                                    </label>
                                    {!['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix'].includes(question.type) && (
                                      <div className="flex-1">
                                        <input type="number" min="0" value={question.points} onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })} placeholder="النقاط" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Options */}
                                  {['single_choice', 'multiple_choice'].includes(question.type) && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-gray-600">الخيارات</label>
                                        {question.type === 'single_choice' && (
                                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                            <input type="checkbox" checked={question.has_counter || false} onChange={(e) => updateQuestion(qIndex, { has_counter: e.target.checked })} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                                            <span className="text-gray-600">عداد</span>
                                          </label>
                                        )}
                                      </div>
                                      <div className="space-y-1.5">
                                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                                          <div key={oi} className="flex items-center gap-1.5">
                                            <input type="text" value={opt.text} onChange={(e) => updateOption(qIndex, oi, { text: e.target.value })} placeholder={`خيار ${oi + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                            <input type="number" min="0" value={opt.points} onChange={(e) => updateOption(qIndex, oi, { points: Number(e.target.value) })} className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center" placeholder="نقاط" />
                                            {question.has_counter && (
                                              <input type="number" min="1" value={opt.counter_target || ''} onChange={(e) => updateOption(qIndex, oi, { counter_target: parseInt(e.target.value) || null })} className="w-14 px-2 py-1.5 border border-emerald-200 rounded-lg text-sm text-center" placeholder="هدف" />
                                            )}
                                            <button onClick={() => removeOption(qIndex, oi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                          </div>
                                        ))}
                                      </div>
                                      <button onClick={() => addOption(qIndex)} className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة خيار
                                      </button>
                                    </div>
                                  )}

                                  {/* Dropdown Options */}
                                  {question.type === 'dropdown' && (
                                    <div>
                                      <select value={question.dropdown_type || 'single'} onChange={(e) => updateQuestion(qIndex, { dropdown_type: e.target.value as 'single' | 'multiple' })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-3">
                                        <option value="single">اختيار واحد</option>
                                        <option value="multiple">اختيار متعدد</option>
                                      </select>
                                      <textarea value={question.bulk_text || ''} onChange={(e) => updateQuestion(qIndex, { bulk_text: e.target.value })} rows={4} placeholder="اكتب كل خيار في سطر منفصل" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                                      <button onClick={() => parseBulkText(qIndex)} className="mt-1.5 w-full py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">تطبيق</button>
                                    </div>
                                  )}

                                  {/* Matrix Options */}
                                  {question.type === 'matrix' && (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">الصفوف</label>
                                        <div className="space-y-1">
                                          {(question.matrix_rows || []).map((row: any, ri: number) => (
                                            <div key={ri} className="flex items-center gap-1">
                                              <input type="text" value={row.text} onChange={(e) => updateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`صف ${ri + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                              <label className="flex items-center gap-1 text-xs shrink-0"><input type="checkbox" checked={row.required} onChange={(e) => updateMatrixRow(qIndex, ri, { required: e.target.checked })} className="w-3.5 h-3.5" /> مطلوب</label>
                                              <button onClick={() => removeMatrixRow(qIndex, ri)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addMatrixRow(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">+ إضافة صف</button>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">الأعمدة</label>
                                        <div className="space-y-1">
                                          {(question.matrix_columns || []).map((col: any, ci: number) => (
                                            <div key={ci} className="flex items-center gap-1">
                                              <input type="text" value={col.text} onChange={(e) => updateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`عمود ${ci + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                              <input type="number" min="0" value={col.points} onChange={(e) => updateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center" placeholder="نقاط" />
                                              <button onClick={() => removeMatrixColumn(qIndex, ci)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addMatrixColumn(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">+ إضافة عمود</button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Scale Options */}
                                  {question.type === 'scale' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">نقاط المقياس</label>
                                      <div className="grid grid-cols-5 gap-1.5">
                                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                                          <div key={oi} className="text-center">
                                            <div className="w-full py-1.5 bg-blue-600 text-white rounded-lg font-bold text-sm mb-1">{opt.text}</div>
                                            <input type="number" value={opt.points} onChange={(e) => { const idx = (question.options || []).findIndex((o: any) => o.id === opt.id); if (idx >= 0) updateOption(qIndex, idx, { points: Number(e.target.value) }) }} className="w-full px-1 py-1 border border-blue-200 rounded text-center text-sm" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Page and Row Group */}
                                  <div className="flex gap-4">
                                    <div className="flex-1 p-2.5 bg-gray-50 rounded-lg">
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">رقم الصفحة</label>
                                      <select value={question.page || 1} onChange={(e) => updateQuestion(qIndex, { page: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                                        {Array.from({ length: Math.max(1, ...formData.questions.map(q => q.page || 1)) }, (_, i) => i + 1).map(p => (
                                          <option key={p} value={p}>الصفحة {p}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex-1 p-2.5 bg-gray-50 rounded-lg">
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">عرض في صف (مجموعة)</label>
                                      <input type="number" min="0" value={question.row_group || ''} onChange={(e) => updateQuestion(qIndex, { row_group: e.target.value ? parseInt(e.target.value) : null })} placeholder="رقم المجموعة" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                  </div>
                                </div>
"""

# 3. Inject settings into question card
old_card_start = """                              <div className="flex items-start gap-3">"""
new_card = """                              <div className="flex items-start gap-3 cursor-pointer" onClick={() => setSelectedQuestionIndex(isSelected ? null : qIndex)}>"""
content = content.replace(old_card_start, new_card)

# Let's find where the question card header ends.
# It ends with:
#                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
#                                   </button>
#                                 </div>
#                               </div>

end_of_header = """                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>"""
                              
new_end_of_header = end_of_header + "\n                              {isSelected && (\n" + settings_jsx + "\n                              )}\n"
content = content.replace(end_of_header, new_end_of_header)

# 4. Replace the Add Question block
old_add_block = """                        {/* Add question to this page */}
                        <div className="flex flex-wrap gap-1.5 pr-10">
                          {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).slice(0, 4).map(([type, info]) => (
                            <button
                              key={type}
                              onClick={() => { const q = addQuestion(type); if (q !== undefined) moveToPage(qs.length, pageNum) }}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                            >
                              {info.icon} {info.label}
                            </button>
                          ))}
                        </div>"""
                        
new_add_block = """                        {/* Add question to this page */}
                        <div className="mt-4 pt-2 border-t border-dashed border-gray-200">
                          <p className="text-sm font-bold text-gray-700 mb-3">إضافة سؤال جديد:</p>
                          <div className="flex flex-wrap gap-2">
                            {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
                              <button
                                key={type}
                                onClick={() => { addQuestion(type); moveToPage(qs.length, pageNum) }}
                                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                              >
                                <span className="text-blue-500 font-bold">{info.icon}</span> {info.label}
                              </button>
                            ))}
                            
                            <button
                              onClick={() => setShowQuestionPicker(true)}
                              className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors flex items-center gap-2 shadow-sm mr-auto"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                              استيراد سؤال
                            </button>
                          </div>
                        </div>"""

content = content.replace(old_add_block, new_add_block)

# 5. Remove right panel and mobile panel
right_panel_start = content.find("{/* ======================== RIGHT PANEL - Add Questions ======================== */}")
right_panel_end = content.find("</main>")
if right_panel_start != -1 and right_panel_end != -1:
    content = content[:right_panel_start] + content[right_panel_end:]

# fix center panel width class
content = content.replace('className="flex-1 min-w-0 max-w-2xl mx-auto"', 'className="flex-1 min-w-0 max-w-4xl mx-auto"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement successful")
