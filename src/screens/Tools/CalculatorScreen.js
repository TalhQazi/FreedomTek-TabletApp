import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = {
  background: '#1E1F25',
  displayBackground: '#111827',
  keypadBackground: '#020617',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  accent: '#6366F1',
  danger: '#EF4444',
  operator: '#F59E0B',
  border: '#111827',
};

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [clearNext, setClearNext] = useState(false);

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setClearNext(false);
  };

  const handleNumberPress = (digit) => {
    setDisplay((current) => {
      if (clearNext || current === '0') {
        setClearNext(false);
        return String(digit);
      }
      return current + String(digit);
    });
  };

  const handleDot = () => {
    setDisplay((current) => {
      if (clearNext) {
        setClearNext(false);
        return '0.';
      }
      if (current.includes('.')) return current;
      return current + '.';
    });
  };

  const parse = (val) => {
    const num = parseFloat(val);
    if (Number.isNaN(num)) return 0;
    return num;
  };

  const performOperation = (op, a, b) => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        if (b === 0) {
          return NaN;
        }
        return a / b;
      default:
        return b;
    }
  };

  const handleOperator = (nextOp) => {
    const currentVal = parse(display);

    if (previousValue === null) {
      setPreviousValue(currentVal);
    } else if (operator) {
      const result = performOperation(operator, previousValue, currentVal);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        setDisplay('Error');
        setPreviousValue(null);
        setOperator(null);
        setClearNext(true);
        return;
      }
      setPreviousValue(result);
      setDisplay(String(result));
    }

    setOperator(nextOp);
    setClearNext(true);
  };

  const handleEquals = () => {
    if (operator === null || previousValue === null) {
      return;
    }
    const currentVal = parse(display);
    const result = performOperation(operator, previousValue, currentVal);

    if (Number.isNaN(result) || !Number.isFinite(result)) {
      setDisplay('Error');
      setPreviousValue(null);
      setOperator(null);
      setClearNext(true);
      return;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setClearNext(true);
  };

  const renderKey = (label, onPress, variant = 'number', flex = 1) => {
    const isOperatorKey = variant === 'operator';
    const isUtilityKey = variant === 'utility';

    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.key,
          { flex },
          isOperatorKey && styles.keyOperator,
          isUtilityKey && styles.keyUtility,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.keyText,
            isOperatorKey && styles.keyTextOperator,
            isUtilityKey && styles.keyTextUtility,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Build a human-friendly expression preview like "50 + 40" while typing
  let expression = '';
  if (previousValue !== null && operator) {
    if (clearNext) {
      // We just chose an operator, user is about to type the second number
      expression = `${previousValue} ${operator}`;
    } else {
      // User is typing the second number
      expression = `${previousValue} ${operator} ${display}`;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calculator</Text>
          <Text style={styles.headerSubtitle}>Quick basic math for inmates</Text>
        </View>

        <View style={styles.displayContainer}>
          {expression ? (
            <Text style={styles.expressionText} numberOfLines={1} adjustsFontSizeToFit>
              {expression}
            </Text>
          ) : null}
          <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
            {display}
          </Text>
        </View>

        <View style={styles.keypadContainer}>
          <View style={styles.row}>
            {renderKey('C', handleClear, 'utility')}
            {renderKey('÷', () => handleOperator('÷'), 'operator')}
          </View>

          <View style={styles.row}>
            {renderKey('7', () => handleNumberPress(7))}
            {renderKey('8', () => handleNumberPress(8))}
            {renderKey('9', () => handleNumberPress(9))}
            {renderKey('×', () => handleOperator('×'), 'operator')}
          </View>

          <View style={styles.row}>
            {renderKey('4', () => handleNumberPress(4))}
            {renderKey('5', () => handleNumberPress(5))}
            {renderKey('6', () => handleNumberPress(6))}
            {renderKey('-', () => handleOperator('-'), 'operator')}
          </View>

          <View style={styles.row}>
            {renderKey('1', () => handleNumberPress(1))}
            {renderKey('2', () => handleNumberPress(2))}
            {renderKey('3', () => handleNumberPress(3))}
            {renderKey('+', () => handleOperator('+'), 'operator')}
          </View>

          <View style={styles.row}>
            {renderKey('0', () => handleNumberPress(0), 'number', 2)}
            {renderKey('.', handleDot)}
            {renderKey('=', handleEquals, 'operator')}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  displayContainer: {
    backgroundColor: COLORS.displayBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  expressionText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  displayText: {
    fontSize: 40,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  keypadContainer: {
    flex: 1,
    backgroundColor: COLORS.keypadBackground,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  keyOperator: {
    backgroundColor: COLORS.operator,
    borderColor: COLORS.operator,
  },
  keyUtility: {
    backgroundColor: '#111827',
    borderColor: COLORS.danger,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  keyTextOperator: {
    color: '#FFFFFF',
  },
  keyTextUtility: {
    color: COLORS.danger,
  },
});
