# Ultra-Simple PowerShell Script for API Fetch Migration
# Uses string replacement instead of complex regex to avoid parsing issues

param(
    [string]$BasePath = "j:\Documents\CODE\Projects\habicore\POS (single)\frontend\src"
)

Write-Host "🚀 Starting Ultra-Simple API Fetch Migration" -ForegroundColor Green
Write-Host "Base Path: $BasePath" -ForegroundColor Cyan

if (-not (Test-Path $BasePath)) {
    Write-Error "Base path does not exist: $BasePath"
    exit 1
}

Set-Location $BasePath

# Function to determine correct import path
function Get-ImportPath {
    param([string]$FilePath)
    
    $relativePath = $FilePath.Replace($BasePath, "").Replace('\', '/')
    $depth = ($relativePath -split '/').Length - 2
    
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
    
    # 1. Add import if not present and file has fetch calls
    if ($content -notlike "*apiFetch*" -and $content -like "*fetch('/api/*") {
        $importPath = Get-ImportPath $FilePath
        $importLine = "import { apiFetch } from '$importPath';"
        
        # Find last import line
        $lines = $content -split "`r?`n"
        $lastImportIndex = -1
        
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -like "import*from*") {
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
    
    # 2. Simple string replacements for common patterns
    
    # Pattern 1: Simple GET with token
    $oldPattern1 = "fetch('/api/"
    $newPattern1 = "apiFetch('/"
    if ($content -like "*$oldPattern1*") {
        # First pass: change the function call
        $content = $content.Replace($oldPattern1, $newPattern1)
        
        # Second pass: fix the headers
        $content = $content -replace ", \{\s*headers:\s*\{\s*Authorization:\s*``Bearer\s*\$\{([^}]+)\}``\s*\}\s*\}", ", `$1"
        $content = $content -replace "apiFetch\(''/([^']+)''\)", "apiFetch(''/`$1'', token)"
        
        Write-Host "  ✓ Updated basic fetch calls" -ForegroundColor Green
        $changed = $true
    }
    
    # Manual replacements for specific common patterns
    $replacements = @{
        # Basic GET patterns
        ", { headers: { Authorization: ``Bearer `${token}`` } }" = ", token"
        ", {`n        headers: { Authorization: ``Bearer `${token}`` }`n      }" = ", token"
        
        # POST/PUT/DELETE patterns  
        ", {`n        method: 'POST',`n        headers: {`n          'Content-Type': 'application/json',`n          Authorization: ``Bearer `${token}```n        },`n        body: JSON.stringify(" = ", token, {`n        method: 'POST',`n        body: JSON.stringify("
        
        ", {`n        method: 'PUT',`n        headers: {`n          'Content-Type': 'application/json',`n          Authorization: ``Bearer `${token}```n        },`n        body: JSON.stringify(" = ", token, {`n        method: 'PUT',`n        body: JSON.stringify("
        
        ", {`n        method: 'DELETE',`n        headers: { Authorization: ``Bearer `${token}`` }`n      }" = ", token, {`n        method: 'DELETE'`n      }"
        
        # Template literal patterns
        "fetch(``/api/" = "apiFetch(``/"
        
        # Return statement patterns
        "return fetch('/api/" = "return apiFetch('/"
        
        # localStorage patterns
        "localStorage.getItem('token')" = "token"
    }
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content -like "*$old*") {
            $content = $content.Replace($old, $new)
            $changed = $true
        }
    }
    
    # Clean up any remaining issues
    if ($changed) {
        # Fix any double slashes in URLs
        $content = $content -replace "apiFetch\('/'/", "apiFetch('/"
        
        # Fix any missing closing parentheses
        $content = $content -replace "apiFetch\(''/([^']+)'', ([^,)]+)\)", "apiFetch(''/`$1'', `$2)"
        
        Write-Host "  ✓ Applied cleanup fixes" -ForegroundColor Green
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
Write-Host "`n📁 Finding TypeScript files with fetch calls..." -ForegroundColor Yellow

$allTsxFiles = Get-ChildItem -Recurse -Filter "*.tsx" -File
$filesToUpdate = @()

foreach ($file in $allTsxFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -like "*fetch('/api/*") {
            $filesToUpdate += $file.FullName
        }
    }
    catch {
        Write-Host "Warning: Could not read $($file.Name)" -ForegroundColor Yellow
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
        Write-Host "  ❌ Error processing $($filePath): $($_.Exception.Message)" -ForegroundColor Red
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
Write-Host "`nRecommendations:" -ForegroundColor Yellow
Write-Host "1. The script did basic replacements - you may need to manually fix some complex patterns" -ForegroundColor White
Write-Host "2. Run: cd frontend && npm run build (to check for TypeScript errors)" -ForegroundColor White
Write-Host "3. Test the application functionality" -ForegroundColor White
Write-Host "4. Check console for any API call issues" -ForegroundColor White
Write-Host "5. Use VS Code search to find any remaining 'fetch('/api/' patterns" -ForegroundColor White
