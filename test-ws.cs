using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var uri = new Uri("wss://kpalimiance.duckdns.org/ws-proxy?auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJmODNmN2E2NyIsImVtYWlsIjoia3BhLnRlY2hwcm9AZ21haWwuY29tIiwiZXhwIjoxNzgwNDk1NjY0LCJpYXQiOjE3ODA0OTIwNjR9.lfYV9Y2yIYsvlZ1WstsbGv0CABhoyrip7BppaqyYMAs");
        using (var ws = new ClientWebSocket()) {
            await ws.ConnectAsync(uri, CancellationToken.None);
            Console.WriteLine("Connected!");
            
            var req = "{\"type\":\"get_market_data\",\"data\":{\"pair\":\"BTC-USDT\"}}";
            var bytes = Encoding.UTF8.GetBytes(req);
            await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            
            var buf = new byte[1024 * 64];
            var res = await ws.ReceiveAsync(new ArraySegment<byte>(buf), CancellationToken.None);
            Console.WriteLine(Encoding.UTF8.GetString(buf, 0, res.Count));
            
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
        }
    }
}
