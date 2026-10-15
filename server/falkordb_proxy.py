import socket
import threading

def forward(src, dst):
    try:
        while True:
            data = src.recv(8192)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def handle(client_sock):
    try:
        backend_sock = socket.create_connection(('127.0.0.1', 6379), timeout=5)
        t1 = threading.Thread(target=forward, args=(client_sock, backend_sock), daemon=True)
        t2 = threading.Thread(target=forward, args=(backend_sock, client_sock), daemon=True)
        t1.start()
        t2.start()
    except Exception as e:
        client_sock.close()

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 6380))
    server.listen(128)
    print("TCP Proxy listening on 0.0.0.0:6380 -> 127.0.0.1:6379", flush=True)
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()

if __name__ == '__main__':
    main()
