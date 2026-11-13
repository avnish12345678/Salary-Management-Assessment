import { Alert, Paper, Stack, Typography } from '@mui/material';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">{title}</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Alert severity="info">
          Module shell is ready. Full implementation continues in later phases.
        </Alert>
      </Paper>
    </Stack>
  );
}
