#!/bin/bash

# Limiance Trading Panel Verification Script
echo "🔍 Verifying Limiance Trading Panel Implementation..."
echo ""

# Check if required files exist
echo "📁 Checking files..."
files=(
  "src/components/trades/trading-panel.tsx"
  "app/(authenticated)/(no-sidebar)/trades/spot/page.tsx"
  "TRADING_PANEL_IMPLEMENTATION.md"
  "IMPLEMENTATION_SUMMARY.md"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    all_exist=false
  fi
done

echo ""

# Check TradingPanel import in spot page
echo "🔗 Checking imports..."
if grep -q "import.*TradingPanel" "app/(authenticated)/(no-sidebar)/trades/spot/page.tsx"; then
  echo "✅ TradingPanel imported correctly"
else
  echo "❌ TradingPanel import not found"
  all_exist=false
fi

echo ""

# Check TradingPanel usage
echo "📦 Checking component usage..."
usage_count=$(grep -c "<TradingPanel" "app/(authenticated)/(no-sidebar)/trades/spot/page.tsx")
if [ "$usage_count" -gt 0 ]; then
  echo "✅ TradingPanel used $usage_count time(s)"
else
  echo "❌ TradingPanel not used in page"
  all_exist=false
fi

echo ""

# Check for required trading services
echo "🔧 Checking service integrations..."
if grep -q "tradingService" "src/components/trades/trading-panel.tsx"; then
  echo "✅ tradingService integrated"
else
  echo "⚠️  tradingService not found"
fi

if grep -q "usePortfolioWs" "src/components/trades/trading-panel.tsx"; then
  echo "✅ usePortfolioWs integrated"
else
  echo "⚠️  usePortfolioWs not found"
fi

if grep -q "cancelSpotOrderWs" "src/components/trades/trading-panel.tsx"; then
  echo "✅ WebSocket order cancellation integrated"
else
  echo "⚠️  WebSocket integration not found"
fi

echo ""

# Summary
echo "📊 Summary:"
if [ "$all_exist" = true ]; then
  echo "✅ All core components are in place"
  echo "✅ Trading panel is ready for testing"
  echo ""
  echo "🚀 Next steps:"
  echo "  1. Run 'npm run dev' to start the development server"
  echo "  2. Navigate to localhost:3000/trades/spot?pair=BTC/USDT"
  echo "  3. Test order placement and cancellation"
  echo "  4. Verify real-time updates"
  echo "  5. Check responsive behavior on mobile"
else
  echo "❌ Some components are missing"
  echo "⚠️  Please review the implementation"
fi

echo ""
echo "📚 Documentation:"
echo "  - TRADING_PANEL_IMPLEMENTATION.md: Comprehensive technical docs"
echo "  - IMPLEMENTATION_SUMMARY.md: Quick reference guide"
echo ""
