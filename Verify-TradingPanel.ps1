# Limiance Trading Panel Verification Script
Write-Host "🔍 Verifying Limiance Trading Panel Implementation..." -ForegroundColor Cyan
Write-Host ""

# Check if required files exist
Write-Host "📁 Checking files..." -ForegroundColor Yellow
$files = @(
    "src\components\trades\trading-panel.tsx",
    "app\(authenticated)\(no-sidebar)\trades\spot\page.tsx",
    "TRADING_PANEL_IMPLEMENTATION.md",
    "IMPLEMENTATION_SUMMARY.md"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""

# Check TradingPanel import in spot page
Write-Host "🔗 Checking imports..." -ForegroundColor Yellow
$spotPage = Get-Content "app\(authenticated)\(no-sidebar)\trades\spot\page.tsx" -Raw
if ($spotPage -match "import.*TradingPanel") {
    Write-Host "✅ TradingPanel imported correctly" -ForegroundColor Green
} else {
    Write-Host "❌ TradingPanel import not found" -ForegroundColor Red
    $allExist = $false
}

Write-Host ""

# Check TradingPanel usage
Write-Host "📦 Checking component usage..." -ForegroundColor Yellow
$usageCount = ([regex]::Matches($spotPage, "<TradingPanel")).Count
if ($usageCount -gt 0) {
    Write-Host "✅ TradingPanel used $usageCount time(s)" -ForegroundColor Green
} else {
    Write-Host "❌ TradingPanel not used in page" -ForegroundColor Red
    $allExist = $false
}

Write-Host ""

# Check for required trading services
Write-Host "🔧 Checking service integrations..." -ForegroundColor Yellow
$tradingPanel = Get-Content "src\components\trades\trading-panel.tsx" -Raw
if ($tradingPanel -match "tradingService") {
    Write-Host "✅ tradingService integrated" -ForegroundColor Green
} else {
    Write-Host "⚠️  tradingService not found" -ForegroundColor Yellow
}

if ($tradingPanel -match "usePortfolioWs") {
    Write-Host "✅ usePortfolioWs integrated" -ForegroundColor Green
} else {
    Write-Host "⚠️  usePortfolioWs not found" -ForegroundColor Yellow
}

if ($tradingPanel -match "cancelSpotOrderWs") {
    Write-Host "✅ WebSocket order cancellation integrated" -ForegroundColor Green
} else {
    Write-Host "⚠️  WebSocket integration not found" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
if ($allExist) {
    Write-Host "✅ All core components are in place" -ForegroundColor Green
    Write-Host "✅ Trading panel is ready for testing" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run 'npm run dev' to start the development server"
    Write-Host "  2. Navigate to localhost:3000/trades/spot?pair=BTC/USDT"
    Write-Host "  3. Test order placement and cancellation"
    Write-Host "  4. Verify real-time updates"
    Write-Host "  5. Check responsive behavior on mobile"
} else {
    Write-Host "❌ Some components are missing" -ForegroundColor Red
    Write-Host "⚠️  Please review the implementation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - TRADING_PANEL_IMPLEMENTATION.md: Comprehensive technical docs"
Write-Host "  - IMPLEMENTATION_SUMMARY.md: Quick reference guide"
Write-Host ""
