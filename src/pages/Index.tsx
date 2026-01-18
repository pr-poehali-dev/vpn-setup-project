import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type Protocol = 'OpenVPN' | 'IKEv2' | 'WireGuard';
type Encryption = 'AES-256-GCM' | 'AES-128-CBC' | 'ChaCha20';

interface Server {
  id: string;
  country: string;
  city: string;
  flag: string;
  load: number;
  ping: number;
}

interface ConnectionLog {
  timestamp: string;
  event: string;
  details: string;
}

const servers: Server[] = [
  { id: '1', country: 'США', city: 'Нью-Йорк', flag: '🇺🇸', load: 45, ping: 23 },
  { id: '2', country: 'США', city: 'Лос-Анджелес', flag: '🇺🇸', load: 67, ping: 35 },
  { id: '3', country: 'Великобритания', city: 'Лондон', flag: '🇬🇧', load: 32, ping: 12 },
  { id: '4', country: 'Германия', city: 'Берлин', flag: '🇩🇪', load: 28, ping: 8 },
  { id: '5', country: 'Нидерланды', city: 'Амстердам', flag: '🇳🇱', load: 51, ping: 15 },
  { id: '6', country: 'Франция', city: 'Париж', flag: '🇫🇷', load: 39, ping: 18 },
  { id: '7', country: 'Япония', city: 'Токио', flag: '🇯🇵', load: 73, ping: 89 },
  { id: '8', country: 'Сингапур', city: 'Сингапур', flag: '🇸🇬', load: 62, ping: 102 },
  { id: '9', country: 'Канада', city: 'Торонто', flag: '🇨🇦', load: 41, ping: 28 },
  { id: '10', country: 'Австралия', city: 'Сидней', flag: '🇦🇺', load: 55, ping: 156 },
];

export default function Index() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [selectedServer, setSelectedServer] = useState<Server>(servers[0]);
  const [protocol, setProtocol] = useState<Protocol>('OpenVPN');
  const [encryption, setEncryption] = useState<Encryption>('AES-256-GCM');
  const [realIP] = useState('185.142.53.28');
  const [vpnIP] = useState('94.156.177.42');
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([
    { timestamp: '14:32:15', event: 'Система готова', details: 'VPN клиент инициализирован' },
    { timestamp: '14:32:18', event: 'Проверка сервера', details: 'Пинг: 23ms, Доступен' },
  ]);

  const handleConnect = () => {
    if (status === 'disconnected') {
      setStatus('connecting');
      const newLog: ConnectionLog = {
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        event: 'Подключение...',
        details: `Инициализация ${protocol} к ${selectedServer.city}`
      };
      setConnectionLogs(prev => [newLog, ...prev]);
      
      setTimeout(() => {
        setStatus('connected');
        const connectedLog: ConnectionLog = {
          timestamp: new Date().toLocaleTimeString('ru-RU'),
          event: 'Подключено',
          details: `Защищенное соединение установлено (${encryption})`
        };
        setConnectionLogs(prev => [connectedLog, ...prev]);
      }, 2000);
    } else if (status === 'connected') {
      const disconnectLog: ConnectionLog = {
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        event: 'Отключение',
        details: 'Соединение безопасно закрыто'
      };
      setConnectionLogs(prev => [disconnectLog, ...prev]);
      setStatus('disconnected');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-secondary';
      case 'connecting': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Защищено';
      case 'connecting': return 'Подключение...';
      default: return 'Не защищено';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Icon name="Shield" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SecureVPN Pro</h1>
              <p className="text-sm text-muted-foreground">Профессиональная защита данных</p>
            </div>
          </div>
          
          <Badge variant={status === 'connected' ? 'default' : 'secondary'} className="h-8 px-4">
            <Icon name="Shield" size={14} className="mr-1" />
            {getStatusText()}
          </Badge>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 bg-card border-border">
              <div className="flex flex-col items-center space-y-6">
                <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all ${
                  status === 'connected' 
                    ? 'bg-secondary/20 glow-effect' 
                    : status === 'connecting'
                    ? 'bg-yellow-500/20'
                    : 'bg-muted'
                }`}>
                  {status === 'connecting' && (
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  )}
                  <Icon 
                    name={status === 'connected' ? 'ShieldCheck' : 'Shield'} 
                    size={96} 
                    className={`${getStatusColor()} ${status === 'connected' ? 'animate-pulse-slow' : ''}`}
                  />
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">{getStatusText()}</h2>
                  <p className="text-muted-foreground">
                    {status === 'connected' 
                      ? `Соединение с ${selectedServer.city}, ${selectedServer.country}` 
                      : 'Нажмите для защиты соединения'}
                  </p>
                </div>

                <Button 
                  size="lg" 
                  onClick={handleConnect}
                  disabled={status === 'connecting'}
                  className={`w-64 h-16 text-lg font-semibold transition-all ${
                    status === 'connected' 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  <Icon name={status === 'connected' ? 'Power' : 'PowerOff'} size={24} className="mr-2" />
                  {status === 'connected' ? 'Отключить' : status === 'connecting' ? 'Подключение...' : 'Подключить'}
                </Button>

                {status === 'connected' && (
                  <div className="w-full grid grid-cols-2 gap-4 pt-4">
                    <Card className="p-4 bg-muted/50 border-border">
                      <div className="flex items-center gap-3">
                        <Icon name="Download" size={20} className="text-secondary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Скачано</p>
                          <p className="text-lg font-bold text-foreground">124.5 MB</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-muted/50 border-border">
                      <div className="flex items-center gap-3">
                        <Icon name="Upload" size={20} className="text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Отправлено</p>
                          <p className="text-lg font-bold text-foreground">89.2 MB</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <Tabs defaultValue="servers" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-6">
                  <TabsTrigger value="servers">
                    <Icon name="Server" size={16} className="mr-2" />
                    Серверы
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Icon name="Settings" size={16} className="mr-2" />
                    Настройки
                  </TabsTrigger>
                  <TabsTrigger value="logs">
                    <Icon name="FileText" size={16} className="mr-2" />
                    Логи
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="servers" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Globe" size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Доступные серверы</h3>
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {servers.map((server) => (
                        <Card
                          key={server.id}
                          className={`p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                            selectedServer.id === server.id ? 'bg-muted border-primary' : 'bg-card'
                          }`}
                          onClick={() => setSelectedServer(server)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{server.flag}</span>
                              <div>
                                <p className="font-semibold text-foreground">{server.city}</p>
                                <p className="text-sm text-muted-foreground">{server.country}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Загрузка</p>
                                <p className="text-sm font-medium text-foreground">{server.load}%</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Пинг</p>
                                <p className="text-sm font-medium text-secondary">{server.ping}ms</p>
                              </div>
                              {selectedServer.id === server.id && (
                                <Icon name="CheckCircle2" size={20} className="text-primary" />
                              )}
                            </div>
                          </div>
                          <Progress value={server.load} className="mt-2 h-1" />
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Протокол</label>
                    <Select value={protocol} onValueChange={(v) => setProtocol(v as Protocol)}>
                      <SelectTrigger className="bg-muted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OpenVPN">OpenVPN (рекомендуется)</SelectItem>
                        <SelectItem value="IKEv2">IKEv2</SelectItem>
                        <SelectItem value="WireGuard">WireGuard</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Протокол определяет метод установки VPN-туннеля
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Шифрование</label>
                    <Select value={encryption} onValueChange={(v) => setEncryption(v as Encryption)}>
                      <SelectTrigger className="bg-muted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AES-256-GCM">AES-256-GCM (максимум)</SelectItem>
                        <SelectItem value="AES-128-CBC">AES-128-CBC (стандарт)</SelectItem>
                        <SelectItem value="ChaCha20">ChaCha20 (быстрый)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Алгоритм шифрования для защиты трафика
                    </p>
                  </div>

                  <Card className="p-4 bg-muted/50 border-border">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" size={20} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Текущая конфигурация</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {protocol} с шифрованием {encryption} обеспечивает надежную защиту данных
                          при передаче через незащищенные сети.
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Activity" size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">История событий</h3>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {connectionLogs.map((log, index) => (
                        <Card key={index} className="p-4 bg-muted/50 border-border">
                          <div className="flex items-start gap-3">
                            <Icon 
                              name={
                                log.event.includes('Подключено') ? 'CheckCircle2' :
                                log.event.includes('Отключение') ? 'XCircle' :
                                log.event.includes('Подключение') ? 'Loader2' : 'Info'
                              } 
                              size={18} 
                              className={
                                log.event.includes('Подключено') ? 'text-secondary' :
                                log.event.includes('Отключение') ? 'text-destructive' :
                                'text-primary'
                              }
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">{log.event}</p>
                                <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Lock" size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Защита данных</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon name="Shield" size={18} className="text-secondary" />
                    <span className="text-sm text-foreground">Kill Switch</span>
                  </div>
                  <Badge variant="default" className="bg-secondary">Активен</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon name="Eye" size={18} className="text-secondary" />
                    <span className="text-sm text-foreground">DNS Leak Protection</span>
                  </div>
                  <Badge variant="default" className="bg-secondary">Активен</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon name="Zap" size={18} className="text-secondary" />
                    <span className="text-sm text-foreground">IPv6 Protection</span>
                  </div>
                  <Badge variant="default" className="bg-secondary">Активен</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon name="RefreshCw" size={18} className="text-secondary" />
                    <span className="text-sm text-foreground">Auto Reconnect</span>
                  </div>
                  <Badge variant="default" className="bg-secondary">Активен</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Globe" size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Сетевая информация</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ваш реальный IP</p>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-mono text-foreground">{realIP}</span>
                    <Badge variant="secondary" className="text-xs">Скрыт</Badge>
                  </div>
                </div>

                {status === 'connected' && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">VPN IP адрес</p>
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-sm font-mono text-foreground">{vpnIP}</span>
                      <Badge variant="default" className="text-xs bg-secondary">Активен</Badge>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Локация</p>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">{selectedServer.flag}</span>
                    <span className="text-sm text-foreground">{selectedServer.city}, {selectedServer.country}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Шифрование</p>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">{encryption}</p>
                    <p className="text-xs text-muted-foreground mt-1">Протокол: {protocol}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
              <div className="flex items-start gap-3">
                <Icon name="ShieldCheck" size={24} className="text-primary" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Ваши данные защищены</h4>
                  <p className="text-xs text-muted-foreground">
                    Военное шифрование AES-256 и строгая политика No-Logs гарантируют 
                    полную конфиденциальность ваших данных.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
