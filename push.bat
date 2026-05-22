@echo off
echo =========================================
echo  Pushing updates to GitHub...
echo =========================================

git add .
git commit -m "Auto-update: %date% %time%"
git push

echo =========================================
echo  Done!
echo =========================================
pause
