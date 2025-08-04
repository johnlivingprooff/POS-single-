# PowerShell Script to Update All fetch() calls to use apiFetch()
# This script will automatically convert all fetch('/api/...') calls to use the new apiFetch utility

param(
    [string]$BasePath = "j:\Documents\CODE\Projects\habicore\POS (single)\frontend\src"
)

Write-Host "🚀 Starting API Fetch Migration Script" -ForegroundColor Green
Write-Host "Base Path: $BasePath" -ForegroundColor Cyan

# Ensure we're in the correct directory
if (-not (Test-Path $BasePath)) {
    Write-Error "Base path does not exist: $BasePath"
    exit 1
}

Set-Location $BasePath

# Function to add apiFetch import if not already present
function Add-ApiFetchImport {
    param([string]$FilePath, [string]$RelativePath)
    
    $content = Get-Content $FilePath -Raw
    
    # Check if apiFetch import already exists
    if ($content -match "import.*apiFetch.*from") {
        Write-Host "  ✓ apiFetch import already exists" -ForegroundColor Yellow
        return
    }
    
    # Find existing imports to determine the correct relative path
    $importLines = $content -split "`n" | Where-Object { $_ -match "^import.*from\s+['\"]\.\./" }
    
    if ($importLines.Count -gt 0) {
        # Find the last import line to insert after
        $lastImportIndex = -1
        $lines = $content -split "`n"
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import.*from\s+['\"]") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            $newImport = "import { apiFetch } from '$RelativePath';"
            $lines = $lines[0..$lastImportIndex] + $newImport + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
            $newContent = $lines -join "`n"
            Set-Content $FilePath $newContent -NoNewline
            Write-Host "  ✓ Added apiFetch import" -ForegroundColor Green
        }
    }
}

# Function to determine the correct relative path for apiFetch import
function Get-ApiFetchImportPath {
    param([string]$FilePath)
    
    $relativePath = (Resolve-Path $FilePath -Relative).Replace('\', '/').Replace('./', '')
    $depth = ($relativePath -split '/').Length - 1
    
    if ($depth -eq 1) { return '../lib/api-utils' }
    if ($depth -eq 2) { return '../../lib/api-utils' }
    if ($depth -eq 3) { return '../../../lib/api-utils' }
    if ($depth -eq 4) { return '../../../../lib/api-utils' }
    return '../lib/api-utils'  # default fallback
}

# Function to update fetch calls in a file
function Update-FetchCalls {
    param([string]$FilePath)
    
    $relativePath = (Resolve-Path $FilePath -Relative)
    Write-Host "Processing: $relativePath" -ForegroundColor Cyan
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $updatedCount = 0
    
    # Add the apiFetch import
    $importPath = Get-ApiFetchImportPath $FilePath
    Add-ApiFetchImport $FilePath $importPath
    
    # Re-read content after potential import addition
    $content = Get-Content $FilePath -Raw
    
    # Pattern 1: Simple GET requests
    # fetch('/api/endpoint', { headers: { Authorization: `Bearer ${token}` } })
    # -> apiFetch('/endpoint', token)
    $pattern1 = "fetch\('/api/([^']+)',\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\}"
    $replacement1 = "apiFetch('/$1', $2"
    
    if ($content -match $pattern1) {
        $content = $content -replace $pattern1, $replacement1
        $updatedCount++
        Write-Host "  ✓ Updated simple GET requests" -ForegroundColor Green
    }
    
    # Pattern 2: GET requests with localStorage.getItem('token')
    $pattern2 = "fetch\('/api/([^']+)',\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{localStorage\.getItem\('token'\)\}`\s*\}\s*\}"
    $replacement2 = "apiFetch('/$1', token"
    
    if ($content -match $pattern2) {
        $content = $content -replace $pattern2, $replacement2
        $updatedCount++
        Write-Host "  ✓ Updated localStorage GET requests" -ForegroundColor Green
    }
    
    # Pattern 3: POST/PUT/DELETE with headers and body
    $pattern3 = "fetch\('/api/([^']+)',\s*\{\s*method:\s*'([^']+)',\s*headers:\s*\{\s*'Content-Type':\s*'application/json',\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}"
    $replacement3 = "apiFetch('/$1', $3, { method: '$2', body: JSON.stringify($4) }"
    
    if ($content -match $pattern3) {
        $content = $content -replace $pattern3, $replacement3
        $updatedCount++
        Write-Host "  ✓ Updated POST/PUT/DELETE with body" -ForegroundColor Green
    }
    
    # Pattern 4: DELETE requests without body
    $pattern4 = "fetch\('/api/([^']+)',\s*\{\s*method:\s*'DELETE',\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\}"
    $replacement4 = "apiFetch('/$1', $2, { method: 'DELETE' }"
    
    if ($content -match $pattern4) {
        $content = $content -replace $pattern4, $replacement4
        $updatedCount++
        Write-Host "  ✓ Updated DELETE requests" -ForegroundColor Green
    }
    
    # Pattern 5: Template literal endpoints
    $pattern5 = "fetch\(`/api/([^`]+)`,\s*\{\s*method:\s*'([^']+)',\s*headers:\s*\{\s*'Content-Type':\s*'application/json',\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}"
    $replacement5 = "apiFetch(`/$1`, $3, { method: '$2', body: JSON.stringify($4) }"
    
    if ($content -match $pattern5) {
        $content = $content -replace $pattern5, $replacement5
        $updatedCount++
        Write-Host "  ✓ Updated template literal requests with body" -ForegroundColor Green
    }
    
    # Pattern 6: Template literal DELETE
    $pattern6 = "fetch\(`/api/([^`]+)`,\s*\{\s*method:\s*'DELETE',\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\}"
    $replacement6 = "apiFetch(`/$1`, $2, { method: 'DELETE' }"
    
    if ($content -match $pattern6) {
        $content = $content -replace $pattern6, $replacement6
        $updatedCount++
        Write-Host "  ✓ Updated template literal DELETE requests" -ForegroundColor Green
    }
    
    # Pattern 7: Simple fetch without auth (for categories, etc.)
    $pattern7 = "fetch\('/api/([^']+)'\)"
    $replacement7 = "apiFetch('/$1', token)"
    
    if ($content -match $pattern7) {
        $content = $content -replace $pattern7, $replacement7
        $updatedCount++
        Write-Host "  ✓ Updated simple fetch calls" -ForegroundColor Green
    }
    
    # Pattern 8: Return statements with fetch
    $pattern8 = "return fetch\('/api/([^']+)',\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\}"
    $replacement8 = "return apiFetch('/$1', $2"
    
    if ($content -match $pattern8) {
        $content = $content -replace $pattern8, $replacement8
        $updatedCount++
        Write-Host "  ✓ Updated return fetch statements" -ForegroundColor Green
    }
    
    # Additional complex patterns for edge cases
    
    # Pattern 9: Multiline fetch with different header order
    $multilinePattern = '(?s)fetch\(''/api/([^'']+)'',\s*\{\s*method:\s*''([^'']+)'',\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`,?\s*''Content-Type'':\s*''application/json''\s*\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}'
    if ($content -match $multilinePattern) {
        $content = $content -replace $multilinePattern, "apiFetch('/$1', $3, { method: '$2', body: JSON.stringify($4) }"
        $updatedCount++
        Write-Host "  ✓ Updated multiline fetch with different header order" -ForegroundColor Green
    }
    
    # Save the updated content if changes were made
    if ($content -ne $originalContent) {
        Set-Content $FilePath $content -NoNewline
        Write-Host "  ✓ File updated with $updatedCount pattern(s)" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

# Main execution
Write-Host "`n📁 Finding TypeScript files..." -ForegroundColor Yellow

# Get all .tsx files that contain fetch('/api/
$filesToUpdate = Get-ChildItem -Recurse -Filter "*.tsx" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "fetch\(['\`]/api/" } |
    Select-Object -ExpandProperty FullName

if ($filesToUpdate.Count -eq 0) {
    Write-Host "✅ No files found with fetch('/api/ patterns" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($filesToUpdate.Count) files to update:" -ForegroundColor Yellow
$filesToUpdate | ForEach-Object { 
    $relativePath = (Resolve-Path $_ -Relative)
    Write-Host "  - $relativePath" -ForegroundColor Gray
}

Write-Host "`n🔄 Starting updates..." -ForegroundColor Yellow

# Process each file
$successCount = 0
$errorCount = 0

foreach ($file in $filesToUpdate) {
    try {
        Update-FetchCalls $file
        $successCount++
    }
    catch {
        Write-Host "  ❌ Error processing file: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n📊 Migration Summary:" -ForegroundColor Cyan
Write-Host "✅ Successfully processed: $successCount files" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "❌ Files with errors: $errorCount" -ForegroundColor Red
}

Write-Host "`n🎉 API Fetch migration completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the application to ensure all API calls work correctly" -ForegroundColor White
Write-Host "2. Check for any TypeScript compilation errors" -ForegroundColor White
Write-Host "3. Verify that all components properly import apiFetch" -ForegroundColor White
Write-Host "4. Test authentication flow in both development and production" -ForegroundColor White
