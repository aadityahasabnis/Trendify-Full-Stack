const Select = ({ value, onChange, children }) => {
    return (
        <select
            value={value}
            onChange={onChange}
            className="border p-2 rounded w-full"
        >
            {children}
        </select>
    );
};
export default Select;
