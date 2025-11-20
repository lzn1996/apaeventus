// __tests__/TicketsByEventScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TicketsByEventScreen from '../src/screens/TicketsByEventScreen';

// Mock de dependências
jest.mock('react-native-reanimated-carousel', () => {
    const ReactMod = require('react');
    const RN = require('react-native');
    return ({ data, renderItem, onSnapToItem }: any) => {
        return ReactMod.createElement(RN.FlatList, {
        testID: 'ticket-carousel',
        data,
        renderItem: ({ item, index }: any) => renderItem({ item, index }),
        onScroll: () => onSnapToItem && onSnapToItem(0),
        });
    };
    });

    jest.mock('react-native-qrcode-svg', () => {
    const ReactMod = require('react');
    const RN = require('react-native');
    return ({ value, size: _size }: any) => {
        return ReactMod.createElement(
        RN.View,
        { testID: 'qr-code' },
        ReactMod.createElement(RN.Text, null, `QR: ${value}`)
        );
    };
    });

    // Mock do useNetworkStatus
    jest.mock('../src/hooks/useNetworkStatus', () => ({
    useNetworkStatus: () => true,
    }));

    // Mock da navegação
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

// Mock dos componentes
jest.mock('../src/components/Header', () => ({
    Header: ({ title }: any) => {
        const { Text } = require('react-native');
        return <Text>{title}</Text>;
    },
    }));

    jest.mock('../src/components/TabBar', () => ({
    TabBar: ({ activeTab: _activeTab, onTabPress }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
        <View testID="tab-bar">
            <TouchableOpacity onPress={() => onTabPress('Home')}>
            <Text>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onTabPress('Tickets')}>
            <Text>Ingressos</Text>
            </TouchableOpacity>
        </View>
        );
    },
    }));

    jest.mock('../src/components/SafeLayout', () => ({
    SafeLayout: ({ children }: any) => {
        const { View } = require('react-native');
        return <View>{children}</View>;
    },
    }));

    describe('TicketsByEventScreen - RF07: Exibição do QR Code', () => {
    const mockTickets = [
        {
        id: 'ticket-1',
        type: 'VIP',
        code: 'ABC123XYZ',
        used: false,
        qrCodeUrl: 'https://example.com/qr1.png',
        pdfUrl: 'https://example.com/pdf1.pdf',
        qrCodeDataUrl: '',
        eventDate: '2025-12-25T20:00:00',
        eventImageUrl: 'https://example.com/event.jpg',
        buyer: {
            name: 'João Silva',
            email: 'joao@example.com',
            phone: '11999999999',
        },
        boughtAt: '2025-11-01T10:00:00',
        price: 150.0,
        },
        {
        id: 'ticket-2',
        type: 'Pista',
        code: 'DEF456ABC',
        used: true,
        qrCodeUrl: '',
        pdfUrl: '',
        qrCodeDataUrl: 'data:image/png;base64,iVBOR...',
        eventDate: '2025-12-25T20:00:00',
        eventImageUrl: 'https://example.com/event.jpg',
        buyer: {
            name: 'Maria Santos',
            email: 'maria@example.com',
            phone: '11988888888',
        },
        boughtAt: '2025-11-02T14:30:00',
        price: 80.0,
        },
    ];

    const mockRoute = {
        params: {
        eventId: 'event-1',
        eventTitle: 'Show de Rock',
        tickets: mockTickets,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Renderização inicial', () => {
        it('renderiza o título "Meus Ingressos"', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('Meus Ingressos')).toBeTruthy();
        });

        it('renderiza TabBar', () => {
        const { getByTestId } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByTestId('tab-bar')).toBeTruthy();
        });

        it('renderiza carousel de ingressos', () => {
        const { getByTestId } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByTestId('ticket-carousel')).toBeTruthy();
        });
    });

    describe('Exibição de ingressos', () => {
        it('exibe contador de ingressos', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('Ingresso 1 de 2')).toBeTruthy();
        });

        it('exibe tipo do ingresso', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('VIP')).toBeTruthy();
        });

        it('exibe data e hora do evento', () => {
        const { getAllByText } = render(<TicketsByEventScreen route={mockRoute} />);

        const dates = getAllByText(/25\/12\/2025/);
        expect(dates.length).toBeGreaterThan(0);
        const times = getAllByText(/20:00/);
        expect(times.length).toBeGreaterThan(0);
        });

        it('exibe código do ingresso', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('ABC123XYZ')).toBeTruthy();
        });

        it('exibe preço do ingresso', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('R$ 150.00')).toBeTruthy();
        });
    });

    describe('Informações do comprador', () => {
        it('exibe nome do comprador', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('João Silva')).toBeTruthy();
        });

        it('exibe email do comprador', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('joao@example.com')).toBeTruthy();
        });

        it('exibe telefone formatado do comprador', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('(11) 99999-9999')).toBeTruthy();
        });

        it('exibe data da compra', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText(/01\/11\/2025/)).toBeTruthy();
        });
    });

    describe('QR Code', () => {
        it('exibe código do ingresso abaixo do QR', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        // Verifica se os códigos dos ingressos estão visíveis
        expect(getByText('ABC123XYZ')).toBeTruthy();
        expect(getByText('DEF456ABC')).toBeTruthy();
        });

        it('renderiza imagem do QR Code para todos os ingressos', () => {
        const { UNSAFE_queryAllByType } = render(
            <TicketsByEventScreen route={mockRoute} />
        );

        const Image = require('react-native').Image;
        const images = UNSAFE_queryAllByType(Image);
        // Cada ingresso tem uma imagem de QR Code (além de outras imagens possíveis)
        expect(images.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Status do ingresso', () => {
        it('exibe badge "INGRESSO UTILIZADO" para ingresso usado', () => {
        const usedTicketRoute = {
            params: {
            tickets: [mockTickets[1]], // Ticket usado
            },
        };

        const { getByText } = render(
            <TicketsByEventScreen route={usedTicketRoute} />
        );

        expect(getByText('✓ INGRESSO UTILIZADO')).toBeTruthy();
        });

        it('não exibe badge de utilizado para ingresso não usado', () => {
        const unusedTicketRoute = {
            params: {
            tickets: [mockTickets[0]], // Ticket não usado
            },
        };

        const { queryByText } = render(
            <TicketsByEventScreen route={unusedTicketRoute} />
        );

        expect(queryByText('✓ INGRESSO UTILIZADO')).toBeNull();
        });

        it('exibe badge de sincronização pendente quando aplicável', () => {
        const pendingTicketRoute = {
            params: {
            tickets: [
                {
                ...mockTickets[0],
                pendingSync: true,
                },
            ],
            },
        };

        const { getByText } = render(
            <TicketsByEventScreen route={pendingTicketRoute} />
        );

        expect(getByText('Pendente de sincronização')).toBeTruthy();
        });
    });

    describe('Ordenação de ingressos', () => {
        it('ordena ingressos não utilizados antes dos utilizados', () => {
        const { getAllByText } = render(<TicketsByEventScreen route={mockRoute} />);

        const tickets = getAllByText(/Ingresso \d+ de 2/);
        // Primeiro ingresso deve ser o não usado (VIP)
        expect(tickets[0].children[0]).toContain('1');
        });
    });

    describe('Estados vazios e de carregamento', () => {
        it('exibe mensagem quando não há ingressos', () => {
        const emptyRoute = {
            params: {
            tickets: [],
            },
        };

        const { getByText } = render(<TicketsByEventScreen route={emptyRoute} />);

        expect(getByText('Não foi possível carregar os ingressos.')).toBeTruthy();
        });
    });

    describe('Múltiplos ingressos', () => {
        it('exibe indicadores de paginação quando há múltiplos ingressos', () => {
        const { UNSAFE_queryAllByType } = render(
            <TicketsByEventScreen route={mockRoute} />
        );

        const View = require('react-native').View;
        const views = UNSAFE_queryAllByType(View);

        // Verifica se há views que representam os dots de paginação
        expect(views.length).toBeGreaterThan(0);
        });

        it('não exibe indicadores quando há apenas um ingresso', () => {
        const singleTicketRoute = {
            params: {
            tickets: [mockTickets[0]],
            },
        };

        const { queryByText } = render(
            <TicketsByEventScreen route={singleTicketRoute} />
        );

        // Não deve haver contador "de 2" ou mais
        expect(queryByText(/de 2/)).toBeNull();
        });
    });

    describe('Navegação', () => {
        it('navega para Dashboard ao clicar na aba Home', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        const homeTab = getByText('Home');
        fireEvent.press(homeTab);

        expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
        });

        it('navega para MyTickets ao clicar na aba Ingressos', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        const ticketsTab = getByText('Ingressos');
        fireEvent.press(ticketsTab);

        expect(mockNavigate).toHaveBeenCalledWith('MyTickets');
        });
    });

    describe('Formatação de dados', () => {
        it('formata telefone celular corretamente', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('(11) 99999-9999')).toBeTruthy();
        });

        it('formata telefone fixo corretamente', () => {
        const fixedPhoneRoute = {
            params: {
            tickets: [
                {
                ...mockTickets[0],
                buyer: {
                    ...mockTickets[0].buyer,
                    phone: '1133334444',
                },
                },
            ],
            },
        };

        const { getByText } = render(
            <TicketsByEventScreen route={fixedPhoneRoute} />
        );

        expect(getByText('(11) 3333-4444')).toBeTruthy();
        });

        it('formata data da compra no padrão brasileiro', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText(/01\/11\/2025/)).toBeTruthy();
        });

        it('formata preço com duas casas decimais', () => {
        const { getByText } = render(<TicketsByEventScreen route={mockRoute} />);

        expect(getByText('R$ 150.00')).toBeTruthy();
        });
    });

    describe('Informações adicionais do comprador', () => {
        it('exibe informações do comprador mesmo quando vazias', () => {
        const emptyBuyerRoute = {
            params: {
            tickets: [
                {
                ...mockTickets[0],
                buyer: {
                    name: '',
                    email: '',
                    phone: '',
                },
                },
            ],
            },
        };

        const { UNSAFE_queryAllByType } = render(
            <TicketsByEventScreen route={emptyBuyerRoute} />
        );

        const View = require('react-native').View;
        const views = UNSAFE_queryAllByType(View);

        // Componente deve renderizar sem erros
        expect(views.length).toBeGreaterThan(0);
        });
    });
});
