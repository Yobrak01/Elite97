const fs = require('fs');
const path = require('path');

const apiJsPath = path.join(__dirname, 'frontend', 'src', 'services', 'api.js');
const apiJsContent = fs.readFileSync(apiJsPath, 'utf8');

const fetchRegexDefaultGet = /fetch\(`\$\{API_URL\}([^`]+)`(,\s*\{[\s\S]*?\}\))?/g;

const frontendRoutes = [];

let match;
while ((match = fetchRegexDefaultGet.exec(apiJsContent)) !== null) {
  let method = 'GET';
  const url = match[1];
  const optionsStr = match[2];
  
  if (optionsStr && optionsStr.includes("method:")) {
      const methodMatch = optionsStr.match(/method:\s*'([^']+)'/);
      if (methodMatch) {
          method = methodMatch[1];
      }
  }

  // Handle dynamic parts like ${id}
  const genericUrl = url.replace(/\$\{.*?\}/g, ':id');
  frontendRoutes.push({ method, url: genericUrl });
}

console.log("Found Frontend Routes:");
frontendRoutes.forEach(r => console.log(`[${r.method}] /api${r.url}`));

// Also check routes defined in backend
const routesDir = path.join(__dirname, 'backend', 'routes');
const routeFiles = fs.readdirSync(routesDir);

const backendRoutes = [];

routeFiles.forEach(file => {
    if (!file.endsWith('.js')) return;
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const prefix = file.replace('Routes.js', ''); // naive
    
    const routerGet = content.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'/g);
    for (const m of routerGet) {
        let routePath = m[2];
        if (routePath === '/') routePath = '';
        backendRoutes.push({ method: m[1].toUpperCase(), url: `/${prefix}${routePath}`});
    }
    
    const routerRoute = content.matchAll(/router\.route\('([^']+)'\)([\s\S]*?);/g);
    for (const m of routerRoute) {
        let routePath = m[1];
        if (routePath === '/') routePath = '';
        const chain = m[2];
        const methods = chain.matchAll(/\.(get|post|put|patch|delete)\(/g);
        for (const m2 of methods) {
            backendRoutes.push({ method: m2[1].toUpperCase(), url: `/${prefix}${routePath}`});
        }
    }
});

console.log("\nFound Backend Routes (approximate):");
backendRoutes.forEach(r => console.log(`[${r.method}] /api${r.url}`));
