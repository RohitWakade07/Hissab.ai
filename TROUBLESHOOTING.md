# 🔧 Troubleshooting Guide

## 🚨 **Common Issues and Solutions**

### **1. Pillow Installation Error (Windows)**

**Problem**: `error: subprocess-exited-with-error` when installing Pillow

**Solutions**:

#### **Option A: Use Minimal Requirements**
```bash
cd expense_reimbursement_system
pip install -r requirements-minimal.txt
```

#### **Option B: Install Pillow Separately**
```bash
pip install Pillow==9.5.0
pip install -r requirements.txt
```

#### **Option C: Use Windows Batch Script**
```bash
# Run the Windows setup script
setup_backend_windows.bat
```

#### **Option D: Install Visual Studio Build Tools**
1. Download Visual Studio Build Tools from Microsoft
2. Install "C++ build tools" workload
3. Try installing Pillow again

### **2. Frontend TypeScript Warnings**

**Problem**: `Duplicate member "getContainer" in class body`

**Solution**: This has been fixed in the latest version. If you still see warnings:
1. Restart the development server: `npm run dev`
2. Clear browser cache
3. The warning should disappear

### **3. CORS Issues**

**Problem**: Frontend can't connect to Django backend

**Solution**: Ensure Django CORS settings are correct:
```python
# In expense_system/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
```

### **4. Database Migration Issues**

**Problem**: Migration errors

**Solution**:
```bash
cd expense_reimbursement_system
python manage.py makemigrations --empty companies
python manage.py makemigrations --empty users
python manage.py makemigrations --empty expenses
python manage.py makemigrations --empty approvals
python manage.py makemigrations --empty ocr
python manage.py migrate
```

### **5. Authentication Not Working**

**Problem**: Login/Signup forms don't work

**Solutions**:

#### **Check Backend is Running**
```bash
cd expense_reimbursement_system
python manage.py runserver
```
Should show: `Starting development server at http://127.0.0.1:8000/`

#### **Check API Endpoints**
Visit: `http://localhost:8000/api/auth/register/`
Should return: `{"username":["This field is required."]}`

#### **Check Frontend Console**
Open browser DevTools (F12) and check for errors in Console tab

### **6. Port Already in Use**

**Problem**: `Port 8000 is already in use`

**Solution**:
```bash
# Kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or use different port
python manage.py runserver 8001
```

### **7. Virtual Environment Issues**

**Problem**: Package installation fails

**Solution**:
```bash
# Create new virtual environment
python -m venv expense_env
expense_env\Scripts\activate
pip install --upgrade pip
pip install -r requirements-minimal.txt
```

## 🚀 **Quick Setup Commands**

### **For Windows Users**
```bash
# 1. Setup backend
setup_backend_windows.bat

# 2. Start backend
cd expense_reimbursement_system
python manage.py runserver

# 3. Start frontend (in new terminal)
npm run dev
```

### **For Mac/Linux Users**
```bash
# 1. Setup backend
python setup_backend.py

# 2. Start backend
cd expense_reimbursement_system
python manage.py runserver

# 3. Start frontend (in new terminal)
npm run dev
```

## 🔍 **Debugging Steps**

### **1. Check Backend Status**
```bash
curl http://localhost:8000/api/auth/register/
# Should return validation error (not connection error)
```

### **2. Check Frontend Status**
```bash
# Visit http://localhost:3001/
# Should show landing page with Login/Signup buttons
```

### **3. Check Browser Console**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Try login/signup and check for API errors

### **4. Check Network Tab**
1. Open DevTools (F12)
2. Go to Network tab
3. Try login/signup
4. Look for failed requests (red entries)

## 📞 **Getting Help**

If you're still having issues:

1. **Check the terminal output** for specific error messages
2. **Check browser console** for JavaScript errors
3. **Verify both servers are running**:
   - Frontend: http://localhost:3001/
   - Backend: http://localhost:8000/
4. **Try the minimal setup** first before adding optional features

## ✅ **Success Indicators**

You'll know everything is working when:

1. **Backend**: `python manage.py runserver` shows "Starting development server"
2. **Frontend**: `npm run dev` shows "Local: http://localhost:3001/"
3. **Landing Page**: Shows Login/Signup buttons in header
4. **Authentication**: Can create account and see dashboard
5. **No Console Errors**: Browser console shows no red errors

## 🎯 **Next Steps After Setup**

Once everything is working:

1. **Create a superuser**: `python manage.py createsuperuser`
2. **Test authentication**: Sign up and login
3. **Explore dashboard**: Check different user roles
4. **Add features**: Start building expense management features

The system is designed to be robust and handle common issues gracefully! 🚀
