'use client';

import React from 'react';
import { Alert, type AlertProps } from './Alert';

export type FeedbackBannerProps = AlertProps;

export function FeedbackBanner(props: FeedbackBannerProps) {
  return <Alert {...props} />;
}
