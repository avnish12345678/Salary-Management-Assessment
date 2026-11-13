import { prisma } from '../../config/db';

export async function listCountries() {
  return prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      currencyCode: true,
    },
  });
}
