const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return (
        <div className="flex justify-center mt-4 space-x-2">
            {[...Array(totalPages)].map((_, index) => (
                <button
                    key={index}
                    className={`px-3 py-1 border ${currentPage === index + 1 ? 'bg-blue-500 text-white' : ''}`}
                    onClick={() => onPageChange(index + 1)}
                >
                    {index + 1}
                </button>
            ))}
        </div>
    );
};
export default Pagination;
