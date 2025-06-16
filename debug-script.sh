# Find the exact source of the router conflict

# 1. Check if server.js was properly updated
echo "=== CHECKING CURRENT SERVER.JS ==="
head -10 server.js
echo ""

# 2. Find ALL files that import or use router/Router
echo "=== FINDING ROUTER IMPORTS ==="
find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" -exec grep -l "router\|Router" {} \;
echo ""

# 3. Check for Express route parameter syntax issues
echo "=== CHECKING FOR ROUTE PARAMETERS ==="
find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" -exec grep -l "app\\.get.*:" {} \;
find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" -exec grep -l "router\\.get.*:" {} \;
echo ""

# 4. Check src/api directory for route files
echo "=== CHECKING API DIRECTORY ==="
ls -la src/api/ 2>/dev/null || echo "No src/api directory"
echo ""

# 5. Look for any Express imports in frontend code
echo "=== CHECKING FOR EXPRESS IMPORTS IN FRONTEND ==="
find src/ -name "*.js" -exec grep -l "express\|Express" {} \;
echo ""

# 6. Check package.json dependencies
echo "=== CHECKING EXPRESS VERSION ==="
npm list express
echo ""