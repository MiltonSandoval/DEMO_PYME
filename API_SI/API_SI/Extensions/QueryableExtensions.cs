using Microsoft.EntityFrameworkCore;
using API_SI.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace API_SI.Extensions
{
    /// <summary>
    /// Extensiones reutilizables de IQueryable para paginación con EF Core.
    /// </summary>
    public static class QueryableExtensions
    {
        /// <summary>
        /// Aplica paginación a una consulta IQueryable y devuelve un PagedResult genérico.
        /// La consulta ya debe estar ordenada antes de llamar a este método.
        /// </summary>
        public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
            this IQueryable<T> query, int page, int pageSize)
        {
            // Aseguramos valores mínimos
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100; // Límite de seguridad

            var totalItems = await query.CountAsync();
            var totalPages = totalItems == 0 ? 1 : (int)Math.Ceiling((double)totalItems / pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<T>
            {
                Items = items,
                TotalItems = totalItems,
                TotalPages = totalPages,
                Page = page,
                PageSize = pageSize
            };
        }

        /// <summary>
        /// Versión que trabaja con IQueryable proyectado (Select) y devuelve PagedResult<object>.
        /// </summary>
        public static async Task<PagedResult<object>> ToPagedResultObjectAsync<T>(
            this IQueryable<T> query, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var totalItems = await query.CountAsync();
            var totalPages = totalItems == 0 ? 1 : (int)Math.Ceiling((double)totalItems / pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Cast<object>()
                .ToListAsync();

            return new PagedResult<object>
            {
                Items = items,
                TotalItems = totalItems,
                TotalPages = totalPages,
                Page = page,
                PageSize = pageSize
            };
        }
    }
}
