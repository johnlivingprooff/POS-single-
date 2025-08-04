# Simplified PowerShell Script for API Fetch Migration
# This script handles the most common fetch patterns with better reliability

param(
    [string]$BasePath = "j:\Documents\CODE\Projects\habicore\POS (single)\frontend\src"
)

Write-Host "🚀 Starting Simplified API Fetch Migration" -ForegroundColor Green
Write-Host "Base Path: $BasePath" -ForegroundColor Cyan

if (-not (Test-Path $BasePath)) {
    Write-Error "Base path does not exist: $BasePath"
    exit 1
}

Set-Location $BasePath

# Function to determine import path depth
function Get-ImportPath {
    param([string]$FilePath)
    
    $relativePath = $FilePath.Replace($BasePath, "").Replace('\', '/')
    $depth = ($relativePath -split '/').Length - 2  # -1 for file itself, -1 for src
    
    switch ($depth) {
        0 { return './lib/api-utils' }
        1 { return '../lib/api-utils' }
        2 { return '../../lib/api-utils' }
        3 { return '../../../lib/api-utils' }
        default { return '../../../lib/api-utils' }
    }
}

# Function to process a single file
function Process-File {
    param([string]$FilePath)
    
    $fileName = Split-Path $FilePath -Leaf
    Write-Host "Processing: $fileName" -ForegroundColor Cyan
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $changed = $false
    
    # 1. Add import if not present
    if ($content -notmatch "import.*apiFetch.*from" -and $content -match "fetch\(['\`]/api/") {
        $importPath = Get-ImportPath $FilePath
        $importLine = "import { apiFetch } from '$importPath';"
        
        # Find where to insert the import (after last import)
        $lines = $content -split "`r?`n"
        $lastImportIndex = -1
        
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import.*from") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            $lines = $lines[0..$lastImportIndex] + $importLine + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
            $content = $lines -join "`n"
            Write-Host "  ✓ Added apiFetch import" -ForegroundColor Green
            $changed = $true
        }
    }
    
    # 2. Replace fetch patterns (simple regex replacements)
    
    # Pattern: fetch('/api/...', { headers: { Authorization: `Bearer ${token}` } })
    $pattern1 = 'fetch\(''/api/([^'']+)'',\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\)'
    if ($content -match $pattern1) {
        $content = $content -replace $pattern1, 'apiFetch(''/$1'', $2)'
        Write-Host "  ✓ Updated GET requests" -ForegroundColor Green
        $changed = $true
    }
    
    # Pattern: fetch('/api/...', { method: 'POST', headers: {...}, body: JSON.stringify(...) })
    $pattern2 = 'fetch\(''/api/([^'']+)'',\s*\{\s*method:\s*''([^'']+)'',\s*headers:\s*\{\s*''Content-Type'':\s*''application/json'',\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}'
    if ($content -match $pattern2) {
        $content = $content -replace $pattern2, 'apiFetch(''/$1'', $3, { method: ''$2'', body: JSON.stringify($4) })'
        Write-Host "  ✓ Updated POST/PUT requests with body" -ForegroundColor Green
        $changed = $true
    }
    
    # Pattern: fetch('/api/...', { method: 'DELETE', headers: { Authorization: ... } })
    $pattern3 = 'fetch\(''/api/([^'']+)'',\s*\{\s*method:\s*''DELETE'',\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\)'
    if ($content -match $pattern3) {
        $content = $content -replace $pattern3, 'apiFetch(''/$1'', $2, { method: ''DELETE'' })'
        Write-Host "  ✓ Updated DELETE requests" -ForegroundColor Green
        $changed = $true
    }
    
    # Pattern: fetch(`/api/...`, { ... }) - template literals
    $pattern4 = 'fetch\(`/api/([^`]+)`,\s*\{\s*method:\s*''([^'']+)'',\s*headers:\s*\{\s*''Content-Type'':\s*''application/json'',\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}'
    if ($content -match $pattern4) {
        $content = $content -replace $pattern4, 'apiFetch(`/$1`, $3, { method: ''$2'', body: JSON.stringify($4) })'
        Write-Host "  ✓ Updated template literal requests" -ForegroundColor Green
        $changed = $true
    }
    
    # Pattern: fetch(`/api/...`, { method: 'DELETE', ... })
    $pattern5 = 'fetch\(`/api/([^`]+)`,\s*\{\s*method:\s*''DELETE'',\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\)'
    if ($content -match $pattern5) {
        $content = $content -replace $pattern5, 'apiFetch(`/$1`, $2, { method: ''DELETE'' })'
        Write-Host "  ✓ Updated template literal DELETE" -ForegroundColor Green
        $changed = $true
    }
    
    # Pattern: Simple fetch('/api/...') without headers
    $pattern6 = 'fetch\(''/api/([^'']+)''\)'
    if ($content -match $pattern6) {
        $content = $content -replace $pattern6, 'apiFetch(''/$1'', token)'
        Write-Host "  ✓ Updated simple fetch calls" -ForegroundColor Green
        $changed = $true
    }
    
    # Pattern: return fetch('/api/...', { headers: ... })
    $pattern7 = 'return fetch\(''/api/([^'']+)'',\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{([^}]+)\}`\s*\}\s*\)'
    if ($content -match $pattern7) {
        $content = $content -replace $pattern7, 'return apiFetch(''/$1'', $2)'
        Write-Host "  ✓ Updated return fetch statements" -ForegroundColor Green
        $changed = $true
    }
    
    # Special case: localStorage.getItem('token')
    $pattern8 = 'fetch\(''/api/([^'']+)'',\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{localStorage\.getItem\(''token''\)\}`\s*\}\s*\)'
    if ($content -match $pattern8) {
        $content = $content -replace $pattern8, 'apiFetch(''/$1'', token)'
        Write-Host "  ✓ Updated localStorage token requests" -ForegroundColor Green
        $changed = $true
    }
    
    # Save if changed
    if ($changed) {
        Set-Content $FilePath $content -NoNewline
        Write-Host "  ✅ File updated successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
        return $false
    }
}

# Main execution
Write-Host "`n📁 Finding files with fetch('/api/ patterns..." -ForegroundColor Yellow

$allTsxFiles = Get-ChildItem -Recurse -Filter "*.tsx" -File
$filesToUpdate = @()

foreach ($file in $allTsxFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match "fetch\(['\`]/api/") {
        $filesToUpdate += $file.FullName
    }
}

if ($filesToUpdate.Count -eq 0) {
    Write-Host "✅ No files found that need updating" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($filesToUpdate.Count) files to update:" -ForegroundColor Yellow
$filesToUpdate | ForEach-Object { 
    $relativePath = $_.Replace($BasePath, "").TrimStart('\')
    Write-Host "  - $relativePath" -ForegroundColor Gray
}

Write-Host "`n🔄 Processing files..." -ForegroundColor Yellow

$successCount = 0
$errorCount = 0

foreach ($filePath in $filesToUpdate) {
    try {
        if (Process-File $filePath) {
            $successCount++
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "✅ Files processed: $($filesToUpdate.Count)" -ForegroundColor Green
Write-Host "✅ Files updated: $successCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "❌ Errors: $errorCount" -ForegroundColor Red
}

Write-Host "`n🎉 Migration completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run build (to check for TypeScript errors)" -ForegroundColor White
Write-Host "2. Test the application functionality" -ForegroundColor White
Write-Host "3. Check console for any API call issues" -ForegroundColor White
