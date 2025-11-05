import React, { RefObject } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    TextInputProps,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../screens/RegisterScreen/styles';

export interface InputComIconeProps extends TextInputProps {
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    inputRef?: RefObject<TextInput | null>;
    containerStyle?: StyleProp<ViewStyle>;
    showToggle?: boolean;
    showValue?: boolean;
    onToggleShow?: () => void;
}

const InputComIcone: React.FC<InputComIconeProps> = ({
    iconName,
    iconColor = '#666',
    inputRef,
    containerStyle,
    showToggle,
    showValue,
    onToggleShow,
    style,
    placeholderTextColor = '#999',
    ...rest
}) => {
    return (
        <View style={[styles.inputWithIcon, containerStyle, style]}>
            <Ionicons
                name={iconName}
                size={24}
                color={iconColor}
                style={styles.inputIcon}
            />
            <TextInput
                ref={inputRef}
                style={styles.inputField}
                placeholderTextColor={placeholderTextColor}
                {...rest}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggleShow}>
                    <Ionicons
                        name={showValue ? 'eye-off' : 'eye'}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default InputComIcone;
