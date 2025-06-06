// src/screens/MyTicketsScreen/styles.ts
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    padding: 16,
  },
  list: {
    marginTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#e3eafc',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#607d8b',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 14,
    color: '#607d8b',
  },
});
